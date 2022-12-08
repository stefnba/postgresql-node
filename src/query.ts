import pgPromise, { IDatabase } from 'pg-promise';
import pg from 'pg-promise/typescript/pg-subset';

import type {
    QueryInputFormat,
    FindQueryOptions,
    QueryCommands,
    QueryReturnMode,
    CustomQueryError
} from './types';

const pgp = pgPromise();

export default class PostgresQuery {
    private client: IDatabase<Record<string, unknown>, pg.IClient>;
    private queryCommand: QueryCommands | undefined;
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
    async findOne(query: QueryInputFormat, options: FindQueryOptions = {}) {
        const queryString = pgp.as.format(query, options.params);
        return this.execute(queryString, 'ONE');
    }

    /**
     * Run a SELECT query that returns multiple rows
     */
    async findMany(query: QueryInputFormat, options: FindQueryOptions = {}) {
        const queryString = pgp.as.format(query, options.params);
        return this.execute(queryString, 'MANY');
    }

    /**
     * Run a UPDATE query
     */
    async update(data: object, options: FindQueryOptions = {}) {
        this.queryCommand = 'UPDATE';
        console.log(this.queryCommand);

        const updateQueryString = pgp.helpers.update(data, null, undefined, {
            emptyUpdate: null
        });

        const q = 'UPDATE';
        return this.execute(q, 'ONE');
    }

    /**
     * Run a CREATE query
     */
    async create(data: object, options: FindQueryOptions = {}) {
        const q = 'UPDATE';
        this.queryCommand = 'CREATE';

        const createQueryString = pgp.helpers.update(data, null, undefined, {
            emptyUpdate: null
        });
        return this.execute(q, 'ONE');
    }

    /**
     * Executes any query, irrespective of command
     */
    async run<R>(
        query: QueryInputFormat,
        mode: QueryReturnMode = 'ONE',
        options: FindQueryOptions = {}
    ): Promise<R> {
        const queryString = pgp.as.format(query, options.params);
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
    private async execute(query: string, mode: QueryReturnMode) {
        if (!query || query.trim() === '') {
            // todo throw error
            throw new Error('');
        }

        return this.client
            .one(query)
            .then((res) => {
                return res;
            })
            .catch((err) => {
                // log query error if no custom method was provided in InitOptions
                if (this.customQueryError) {
                    return this.customQueryError({
                        table: 'x',
                        command: this.queryCommand,
                        hint: err.hint,
                        position: err.position,
                        message: err.message,
                        query: 'asdfsdaf',
                        error: err
                    });
                } else {
                    console.error(err);
                }
                throw new Error('QUERY_ERROR');
            });
    }
}
