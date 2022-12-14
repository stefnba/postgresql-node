import { IDatabase } from 'pg-promise';
import pg from 'pg-promise/typescript/pg-subset';

import { chainQueryParts, pgFormat, pgHelpers, buildColumnSet } from './utils';
import type {
    QueryInputFormat,
    FindOneQueryParams,
    FindManyQueryParams,
    QueryCommands,
    QueryReturnMode,
    CustomQueryError,
    CreateOneQueryParams,
    UpdateOneQueryParams,
    UpdateManyQueryParams,
    CreateManyQueryParams,
    QueryErrorArgs,
    QueryInitConfig
} from './types';
import QueryError from './errors';
import { QueryErrorCodes } from './constants';
import pagination from './pagination';

export default class PostgresQuery {
    private client: IDatabase<Record<string, unknown>, pg.IClient>;
    private customQueryError: CustomQueryError | undefined;
    private table: string | undefined;

    task: typeof this.client.task;
    transaction: typeof this.client.tx;

    constructor(
        client: IDatabase<Record<string, unknown>, pg.IClient>,
        config: QueryInitConfig
    ) {
        this.table = config.table;
        this.client = client;
        this.customQueryError = config.queryError;

        // transactions and tasks
        this.task = this.client.task;
        this.transaction = this.client.tx;
    }

    /**
     * Run a SELECT query that returns a single record
     */
    async findOne<R>(params: FindOneQueryParams): Promise<R> {
        const queryString = pgFormat(params.query, params.params);
        const q = chainQueryParts([
            queryString,
            { type: 'WHERE', query: params.filter }
        ]);
        return this.execute(q, 'ONE', 'SELECT');
    }

    /**
     * Run a SELECT query that returns multiple record
     */
    async findMany<R>(params: FindManyQueryParams): Promise<R[]> {
        const queryString = pgFormat(params.query, params.params);
        const q = chainQueryParts([
            queryString,
            { type: 'WHERE', query: params.filter },
            { type: 'LIMIT', query: pagination.pageSize(params.pagination) },
            { type: 'OFFSET', query: pagination.page(params.pagination) }
        ]);
        return this.execute(q, 'MANY', 'SELECT');
    }

    /**
     * Run a UPDATE query that changes a single record
     */
    async updateOne<R>(params: UpdateOneQueryParams): Promise<R> {
        const command = 'UPDATE';
        const table = params.table || this.table;

        // todo table empty error

        const updateQueryString = pgHelpers.update(
            params.data,
            buildColumnSet(params.columns, table),
            table,
            {
                emptyUpdate: null
            }
        );

        if (!updateQueryString) {
            this.throwError({
                code: QueryErrorCodes.NoUpdateColumns,
                message: 'No columns for updating were provided',
                command,
                table,
                query: ''
            });
        }

        const q = chainQueryParts([
            updateQueryString,
            { type: 'WHERE', query: params.filter },
            { type: 'RETURNING', query: params.returning }
        ]);

        return this.execute(q, 'ONE', command, table);
    }

    /**
     * Run a UPDATE query that changes multiple records
     */
    async updateMany<R>(params: UpdateManyQueryParams): Promise<R[]> {
        const command = 'UPDATE';
        const table = params.table || this.table;

        // todo table empty error

        const updateQueryString = pgHelpers.update(
            params.data,
            buildColumnSet(params.columns, table),
            table,
            {
                emptyUpdate: null
            }
        );

        if (!updateQueryString) {
            this.throwError({
                code: QueryErrorCodes.NoUpdateColumns,
                message: 'No columns for updating were provided',
                command,
                table,
                query: ''
            });
        }

        const q = chainQueryParts([
            updateQueryString,
            { type: 'WHERE', query: params.filter },
            { type: 'RETURNING', query: params.returning }
        ]);

        return this.execute(q, 'MANY', command, table);
    }

    /**
     * Run a CREATE query
     */
    async createOne<R>(params: CreateOneQueryParams): Promise<R> {
        const command = 'CREATE';
        const table = params.table || this.table;

        // todo table empty error

        const createQueryString = pgHelpers.insert(
            params.data,
            buildColumnSet(params.columns, table),
            table
        );

        if (!createQueryString) {
            throw Error('No columns for creating were provided!');
        }

        const q = chainQueryParts([
            createQueryString,
            { type: 'CONFLICT', query: params.conflict },
            { type: 'RETURNING', query: params.returning }
        ]);

        return this.execute(q, 'ONE', command, table);
    }

    /**
     * Run a CREATE query that creates multiple records
     */
    async createMany<R>(params: CreateManyQueryParams): Promise<R[]> {
        const command = 'CREATE';
        const table = params.table || this.table;

        // todo table empty error

        const createQueryString = pgHelpers.insert(
            params.data,
            buildColumnSet(params.columns, table),
            table
        );

        if (!createQueryString) {
            throw Error('No columns for creating were provided!');
        }

        const q = chainQueryParts([
            createQueryString,
            { type: 'CONFLICT', query: params.conflict },
            { type: 'RETURNING', query: params.returning }
        ]);

        return this.execute(q, 'ANY', command, table);
    }

    /**
     * Executes any query
     */
    async run<R>(
        query: QueryInputFormat,
        params: Record<string, unknown> = {},
        mode: QueryReturnMode = 'ONE'
    ): Promise<R> {
        const queryString = pgFormat(query, params);
        return this.execute(queryString, mode);
    }

    /**
     * Central method that executes all queries
     */
    private async execute(
        query: string,
        queryReturnMode: QueryReturnMode,
        queryCommand: QueryCommands | undefined = undefined,
        table: string | undefined = undefined
    ) {
        if (!query || query.trim() === '') {
            return this.throwError({
                command: queryCommand,
                query,
                table,
                code: QueryErrorCodes.EmptyQuery,
                message: 'An empty query was provided'
            });
        }

        return this.client
            .any(query)
            .then((res) => {
                // console.log(query, queryReturnMode, res);
                if (Array.isArray(res) && queryReturnMode === 'ONE') {
                    // not results found
                    if (res.length === 0) {
                        return null;
                    }
                    // return single record as object, not array
                    if (res.length === 1) {
                        return res[0];
                    }
                    // Multiple rows error
                    return this.throwError({
                        command: queryCommand,
                        query,
                        table,
                        code: QueryErrorCodes.MultipleRowsReturned,
                        message:
                            "Multiple rows were not expected for query return mode 'ONE'"
                    });
                }
                return res;
            })
            .catch((err) => {
                // Constraint error, e.g. unique constraint
                if ('constraint' in err && err.constraint) {
                    return this.throwError({
                        table,
                        command: queryCommand,
                        message: err.message,
                        query: query,
                        cause: err,
                        hint: `constraint ${err.constraint}: ${err.detail}`,
                        code: QueryErrorCodes.ConstraintViolation
                    });
                }

                //
                if (err.message.includes('violates not-null constraint')) {
                    return this.throwError({
                        table,
                        command: queryCommand,
                        message: err.message,
                        query: query,
                        cause: err,
                        hint: `not-null constraint in column "${err.column}"`,
                        code: QueryErrorCodes.ConstraintViolation
                    });
                }

                // prevent double error from MultipleRowsReturned
                if (err instanceof QueryError) throw err;

                // Generic error
                return this.throwError({
                    table,
                    command: queryCommand,
                    hint: err.hint,
                    position: err.position,
                    code: QueryErrorCodes.ExecutionError,
                    message: err.message,
                    query: query,
                    cause: err
                });
            });
    }

    /**
     * Throws QueryError directly or customQueryError if method is provided upon setup
     * @param options
     * @returns
     */
    private throwError(options: QueryErrorArgs) {
        if (this.customQueryError) {
            return this.customQueryError(options);
        }
        throw new QueryError(options);
    }
}
