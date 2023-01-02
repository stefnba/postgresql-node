import { QueryFile } from 'pg-promise';
import {
    Database,
    DatabaseOptions,
    FindQueryParams,
    AddQueryParams,
    UpdateQueryParams,
    QueryCommands,
    QueryConcatenationParams
} from './types';
import { pgFormat, pgHelpers, queryToString } from './utils';

export default class PostgresQuery<P extends FindQueryParams | AddQueryParams> {
    private db: Database;
    private command: QueryCommands;
    table?: string;

    constructor(
        client: Database,
        options: DatabaseOptions,
        command: QueryCommands,
        table?: string
    ) {
        this.db = client;
        this.command = command;
        this.table = table;
    }

    /**
     *
     * @param client
     * @param options
     * @returns
     */
    static init(client: Database, options: DatabaseOptions, table?: string) {
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
            )
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
     *
     * @param parts Array of string|QueryFile|object
     * - string
     * - QueryFile
     * - object with type and query as keys
     * @returns
     */
    private concatenateQuery(parts: QueryConcatenationParams) {
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
            if (type === 'CONFLICT') {
                return;
            }
            if (type === 'LIMIT') {
                return;
            }
            if (type === 'OFFSET') {
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
     * @param params
     *
     * @returns
     * Full SELECT query that can be run against database
     */
    private buildFindQuery(params: FindQueryParams) {
        const { query, filter } = params;
        return this.concatenateQuery([query, { type: 'WHERE', query: '' }]);
    }

    private builAddQuery(params: AddQueryParams) {
        const { data, columns, params: p, returning, table: t } = params;

        const table = t || this.table;

        if (!table) {
            throw new Error('table');
        }

        const insert = pgHelpers.insert(data, columns, table);
        return this.concatenateQuery([
            insert,
            { type: 'RETURNING', query: returning }
        ]);
    }

    private builUpdateQuery(params: UpdateQueryParams) {
        const { data, columns, params: p, table: t } = params;

        const table = t || this.table;

        if (!table) {
            throw new Error('table');
        }

        const update = pgHelpers.update(data, columns, table);

        return this.concatenateQuery([update, { type: 'WHERE', query: '' }]);
    }

    /**
     *
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
        return '';
    }

    /**
     *
     * @param params
     *
     * @returns
     */
    async one<R>(params: P): Promise<R> {
        const query = this.buildQuery(params);
        const result = await this.execute(query, params.params);

        if (Array.isArray(result)) {
            if (result.length === 1) {
                return result[0];
            } else {
                throw new Error('ddd');
            }
        }

        return result;
    }

    /**
     *
     * @param params
     * @returns
     */
    async many<R>(params: P): Promise<R[]> {
        const query = this.buildQuery(params);
        const result = await this.execute(query, params.params);
        return result;
    }

    /**
     *
     * @param params
     */
    async none(params: P): Promise<void> {
        const query = this.buildQuery(params);
        await this.execute(query, params.params);
    }

    throwQueryError() {
        return 1;
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

        const fullQuery = pgFormat(query, params);

        console.log(query);

        return 1;

        return this.db
            .any(fullQuery)
            .then((r) => {
                console.log('r', r);

                return r;
            })
            .catch((e) => {
                console.log(e);
            });
    }
}
