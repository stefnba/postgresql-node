import { QueryFile } from 'pg-promise';
import { QueryError } from './error';
import pagination from './pagination';
import PostgresBatchQuery from './batch';
import {
    Database,
    DatabaseOptions,
    FindQueryParams,
    AddQueryParams,
    UpdateQueryParams,
    QueryConcatenationParams,
    RunQueryParams,
    QueryInitCommands,
    BatchQueryCallback,
    TransactionClient
} from './types';
import { pgFormat, pgHelpers } from './utils';

export default class PostgresQuery<
    P extends
        | FindQueryParams
        | AddQueryParams
        | UpdateQueryParams
        | RunQueryParams
> {
    private db: Database | TransactionClient;
    private command: QueryInitCommands;
    private dbOptions: DatabaseOptions;
    table?: string;

    constructor(
        client: Database | TransactionClient,
        options: DatabaseOptions,
        command: QueryInitCommands,
        table?: string
    ) {
        console.log(client.constructor.name);
        this.db = client;
        this.command = command;
        this.table = table;
        this.dbOptions = options;
    }

    /**
     *
     * @param client
     * @param options
     * @returns
     */
    static init(
        client: Database | TransactionClient,
        options: DatabaseOptions,
        table?: string
    ) {
        return {
            find: new PostgresQuery<FindQueryParams>(
                client,
                options,
                'SELECT',
                table
            ),
            update: new PostgresQuery<UpdateQueryParams>(
                client,
                options,
                'UPDATE',
                table
            ),
            add: new PostgresQuery<AddQueryParams>(
                client,
                options,
                'INSERT',
                table
            ),
            run: new PostgresQuery<RunQueryParams>(
                client,
                options,
                'RUN',
                table
            ),
            transaction: (callback: BatchQueryCallback) => {
                const trx = new PostgresBatchQuery(client, options);
                return trx.executeTransaction(callback);
            },
            batch: (callback: BatchQueryCallback) => {
                const trx = new PostgresBatchQuery(client, options);
                return trx.executeBatch(callback);
            }
        };
    }

    /**
     * Checks if query includes certain clauses, e.g. WHERE, RETURNING, to avoid errors
     * @param query string
     * String that will be checked if clause exists
     * @param clause string
     *
     * @returns
     */
    private queryIncludesClause(query: string, clause: string) {
        if (query.toLowerCase().includes(clause.toLowerCase())) return true;
        return false;
    }

    /**
     * Concatenate different parts of query and determined if certain clauses, operators need to be inserted
     * @param parts Array of string|QueryFile|object
     * - string
     * - QueryFile
     * - object with keys: type, query
     * @returns string
     * Final query with all parts concatenated
     */
    private concatenateQuery(parts: QueryConcatenationParams): string {
        let fullQuery = '';

        parts.forEach((part) => {
            // normal string, QueryFile no longer possible here
            if (typeof part === 'string') {
                fullQuery += ` ${part}`;
                return;
            }
            // QueryFile
            if (part instanceof QueryFile) {
                fullQuery += ` ${pgFormat(part)}`;
                return;
            }

            // object
            const { query: q, type } = part;

            // return if undefined
            if (q === undefined) return;
            const query = pgFormat(q);

            if (type === 'RETURNING') {
                const clause = 'RETURNING';
                if (
                    this.queryIncludesClause(fullQuery, clause) ||
                    this.queryIncludesClause(query, clause)
                ) {
                    fullQuery += ` ${query}`;
                    return;
                }
                fullQuery += ` ${clause} ${query}`;
                return;
            }
            if (type === 'WHERE') {
                const clause = 'WHERE';
                if (
                    this.queryIncludesClause(fullQuery, clause) ||
                    this.queryIncludesClause(query, clause)
                ) {
                    fullQuery += ` AND ${query}`;
                    return;
                }
                fullQuery += ` ${clause} ${query}`;
                return;
            }
            if (type === 'CONFLICT') {
                const clause = 'CONFLICT ON';
                if (
                    this.queryIncludesClause(fullQuery, clause) ||
                    this.queryIncludesClause(query, clause)
                ) {
                    fullQuery += ` ${query}`;
                    return;
                }
                fullQuery += ` ${clause} ${query}`;
                return;
            }
            if (type === 'LIMIT') {
                const clause = 'LIMIT';
                if (
                    this.queryIncludesClause(fullQuery, clause) ||
                    this.queryIncludesClause(query, clause)
                ) {
                    fullQuery += ` ${query}`;
                    return;
                }
                fullQuery += ` ${clause} ${query}`;
                return;
            }
            if (type === 'OFFSET') {
                const clause = 'OFFSET';
                if (
                    this.queryIncludesClause(fullQuery, clause) ||
                    this.queryIncludesClause(query, clause)
                ) {
                    fullQuery += ` ${query}`;
                    return;
                }
                fullQuery += ` ${clause} ${query}`;
                return;
            }
            if (type === 'ORDER') {
                const clause = 'ORDER BY';
                if (
                    this.queryIncludesClause(fullQuery, clause) ||
                    this.queryIncludesClause(query, clause)
                ) {
                    fullQuery += ` ${query}`;
                    return;
                }
                fullQuery += ` ${clause} ${query}`;
                return;
            }
        });
        return fullQuery;
    }

    /**
     * Constructs a SELECT query from individual params
     * @param params object
     *
     * @returns
     * Full SELECT query that can be run against database
     */
    private buildFindQuery(params: FindQueryParams) {
        const { query, filter, pagination: p } = params;
        return this.concatenateQuery([
            query,
            { type: 'WHERE', query: filter },
            { query: pagination.pageSize(p), type: 'LIMIT' },
            { query: pagination.page(p), type: 'OFFSET' }
        ]);
    }

    private buildRunQuery(params: RunQueryParams) {
        const { query } = params;
        return this.concatenateQuery([query]);
    }

    /**
     * Constructs a INSERT query from individual params
     * @param params object
     *
     * @returns
     * Full INSERT query that can be run against database
     */
    private builAddQuery(params: AddQueryParams) {
        const { data, columns, returning, table: t, conflict } = params;

        const table = t || this.table;

        if (!table) {
            throw new Error('table');
        }

        const insert = pgHelpers.insert(data, columns, table);
        return this.concatenateQuery([
            insert,
            { type: 'RETURNING', query: returning },
            { type: 'CONFLICT', query: conflict }
        ]);
    }

    /**
     * Constructs a UPDATE query from individual params
     * @param params object
     *
     * @returns
     * Full UPDATE query that can be run against database
     */
    private builUpdateQuery(params: UpdateQueryParams) {
        const { data, columns, table: t, returning, filter, conflict } = params;

        const table = t || this.table;

        if (!table) {
            throw new Error('table');
        }

        const update = pgHelpers.update(data, columns, table);

        return this.concatenateQuery([
            update,
            { type: 'WHERE', query: filter },
            { type: 'RETURNING', query: returning },
            { type: 'CONFLICT', query: conflict }
        ]);
    }

    /**
     * Determines which build method is used
     * @param params
     * @returns
     * Final query, tailored to each command
     */
    private buildQuery(params: P) {
        if (this.command === 'SELECT') {
            return this.buildFindQuery(params as FindQueryParams);
        }
        if (this.command === 'INSERT') {
            return this.builAddQuery(params as AddQueryParams);
        }
        if (this.command === 'UPDATE') {
            return this.builUpdateQuery(params as UpdateQueryParams);
        }
        if (this.command === 'RUN') {
            return this.buildRunQuery(params as RunQueryParams);
        }
        if (this.command === 'TRANSACTION') {
            return this.buildRunQuery(params as RunQueryParams);
        }
        return '';
    }

    /**
     * Triggers building and execution of query and returns one record
     * @param params
     *
     * @returns object
     * One database record
     */
    async one<R extends Record<string, unknown>>(params: P): Promise<R> {
        const query = this.buildQuery(params);
        const result = await this.execute(query, params.params);

        if (Array.isArray(result)) {
            if (result.length === 1) {
                return result[0];
            }
            // if (result.length === 0) {
            //     return null;
            // }
            throw new QueryError({
                command: this.command,
                message: '',
                table: this.table,
                query: query
            });
        }

        return result;
    }

    /**
     * Triggers building and execution of query and returns multiple records
     * @param params
     * @returns Array<object>
     * List of database records
     */
    async many<R extends Record<string, unknown>>(params: P): Promise<R[]> {
        const query = this.buildQuery(params);
        const result = await this.execute(query, params.params);
        return result;
    }

    /**
     * Triggers building and execution of query and return nothing
     * @param params object
     */
    async none(params: P): Promise<void> {
        const query = this.buildQuery(params);
        await this.execute(query, params.params);
    }

    /**
     * Executes constructed query against database.
     * Handles query and query result errors
     * @param query string
     * Final query as string
     * @param params object
     * Any parameters that were supplied
     * @returns
     *
     */
    private async execute(query: string, params?: object): Promise<any | null> {
        if (query.trim() === '') {
            throw new Error('EMPTY QUERY');
        }

        const fullQuery = pgFormat(query, params).trim();

        return this.db
            .any(fullQuery)
            .then((r) => {
                if (this.dbOptions.query?.onReturn) {
                    this.dbOptions.query?.onReturn(r, fullQuery);
                }
                return r;
            })
            .catch((e) => {
                if (this.dbOptions.query?.onError) {
                    this.dbOptions.query?.onError(
                        { message: e.message },
                        fullQuery
                    );
                } else {
                    throw new QueryError({
                        command: this.command,
                        message: e.message,
                        query: fullQuery,
                        table: this.table,
                        cause: e
                    });
                }
                console.log(e);
            });
    }
}
