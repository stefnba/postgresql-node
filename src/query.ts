import { IDatabase } from 'pg-promise';
import pg from 'pg-promise/typescript/pg-subset';

import { chainQueryParts, pgFormat, pgHelpers } from './utils';
import type {
    QueryInputFormat,
    FindQueryParams,
    QueryCommands,
    QueryReturnMode,
    CustomQueryError,
    CreateQueryParams,
    UpdateQueryParams,
    QueryErrorArgs
} from './types';
import QueryError from './errors';
import { QueryErrorCodes } from './constants';

export default class PostgresQuery {
    private client: IDatabase<Record<string, unknown>, pg.IClient>;
    private customQueryError: CustomQueryError | undefined;

    constructor(
        client: IDatabase<Record<string, unknown>, pg.IClient>,
        customQueryError: CustomQueryError | undefined
    ) {
        this.client = client;
        this.customQueryError = customQueryError;
    }

    /**
     * Run a SELECT query that returns a single row
     */
    async findOne<R>(params: FindQueryParams): Promise<R> {
        const queryString = pgFormat(params.query, params.params);
        return this.execute(queryString, 'ONE', 'SELECT');
    }

    /**
     * Run a SELECT query that returns multiple rows
     */
    async findMany<R>(params: FindQueryParams): Promise<R[]> {
        const queryString = pgFormat(params.query, params.params);
        return this.execute(queryString, 'MANY', 'SELECT');
    }

    /**
     * Run a UPDATE query
     */
    async update<R>(params: UpdateQueryParams): Promise<R> {
        const command = 'UPDATE';
        const table = params.table;

        const updateQueryString = pgHelpers.update(params.data, null, table, {
            emptyUpdate: null
        });

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
     * Run a CREATE query
     */
    async create<R>(params: CreateQueryParams): Promise<R> {
        const table = params.table;

        const createQueryString = pgHelpers.insert(params.data, null, table);

        if (!createQueryString) {
            throw Error('No columns for creating were provided!');
        }

        const q = chainQueryParts([
            createQueryString,
            { type: 'CONFLICT', query: params.conflict },
            { type: 'RETURNING', query: params.returning }
        ]);

        return this.execute(q, 'ONE', 'CREATE', table);
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
     * Initiate a transaction
     */
    async transaction() {
        return this.client.tx;
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
                // Constraint error
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
