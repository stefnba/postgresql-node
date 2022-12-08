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
    UpdateQueryParams
} from './types';

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
        return this.execute(queryString, 'ONE');
    }

    /**
     * Run a SELECT query that returns multiple rows
     */
    async findMany<R>(params: FindQueryParams): Promise<R[]> {
        const queryString = pgFormat(params.query, params.params);
        return this.execute(queryString, 'MANY');
    }

    /**
     * Run a UPDATE query
     */
    async update<R>(params: UpdateQueryParams): Promise<R> {
        const table = params.table;

        const updateQueryString = pgHelpers.update(params.data, null, table, {
            emptyUpdate: null
        });

        if (!updateQueryString) {
            throw Error('No columns for updating were provided!');
        }

        const q = chainQueryParts([
            updateQueryString,
            { type: 'WHERE', query: params.filter },
            { type: 'RETURNING', query: params.returning }
        ]);

        return this.execute(q, 'ONE', 'UPDATE', table);
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
            // todo throw error
            throw new Error('');
        }

        const queryMode =
            queryReturnMode === 'MANY' ? 'manyOrNone' : 'oneOrNone';

        return this.client[queryMode](query)
            .then((res) => {
                if (Array.isArray(res) && queryReturnMode === 'ONE') {
                    if (res.length === 1) {
                        return res[0];
                    }
                }
                return res;
            })
            .catch((err) => {
                // Constraint error

                // Generic error
                if (this.customQueryError) {
                    console.error(err);
                    return this.customQueryError({
                        table: table,
                        command: queryCommand,
                        hint: err.hint,
                        position: err.position,
                        message: err.message,
                        query: 'asdfsdaf',
                        cause: err
                    });
                } else {
                    console.error(err);
                }
                throw new Error('QUERY_ERROR');
            });

        // try {
        //     // mode many result
        //     if (this.queryReturnMode === 'MANY') {
        //         return this.client.manyOrNone(query);
        //     }

        //     // mode one result
        //     return this.client.oneOrNone(query);
        // } catch (err) {
        //     console.log(err.hint);
        //     if (err instanceof Error) {
        //         console.log(err.message);
        //         throw new Error('QUERY_ERROR');
        //     }
        // }
        // log query error if no custom method was provided in InitOptions
        // if (err instance of Error) {

        // }
        // console.log(err)

        // }
    }
}
