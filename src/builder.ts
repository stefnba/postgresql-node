import PostgresBatchQuery from './batch';
import {
    DatabaseClient,
    DatabaseOptions,
    FindQueryParams,
    AddQueryParams,
    UpdateQueryParams,
    DataInput,
    BatchQueryCallback,
    BatchClient,
    QueryInput
} from './types';
import Query from './query';

import { concatenateQuery, pgFormat, buildUpdateInsertQuery } from './utils';
import pagination from './pagination';
import { buildFilters } from './filter';

/**
 * Simplifies construction of pg queries.
 */
export default class QueryBuilder<Model = undefined> {
    private client: DatabaseClient | BatchClient;
    private table?: string;
    private options: DatabaseOptions;
    private isBatch: boolean;

    constructor(
        client: DatabaseClient | BatchClient,
        options: DatabaseOptions,
        table?: string
    ) {
        this.table = table;

        this.isBatch = client.constructor.name === 'Task' ? true : false;
        this.client = client;
        this.options = options;
    }

    /**
     * Builds SELECT query that can be extended with filter and pagination
     * @param query string
     * @param params object
     * @returns
     *
     */
    find<M = Model extends undefined ? unknown : Model>(
        query: QueryInput,
        params?: FindQueryParams<Model extends undefined ? M : Model>
    ): Query {
        const _query = concatenateQuery([
            pgFormat(query, params?.params),
            { type: 'WHERE', query: buildFilters(params?.filter) },
            { query: pagination.pageSize(params?.pagination), type: 'LIMIT' },
            { query: pagination.page(params?.pagination), type: 'OFFSET' }
        ]);

        return new Query(this.client.any, this.isBatch, _query, {
            command: 'SELECT',
            table: this.table,
            log: this.options.query
        });
    }

    /**
     * Executes any query
     * @param query
     * @param params
     * @returns
     */
    run(query: QueryInput, params?: object) {
        return new Query(
            this.client.any,
            this.isBatch,
            pgFormat(query, params),
            {
                command: 'RUN',
                log: this.options.query,
                table: this.table
            }
        );
    }

    /**
     * Builds INSERT query
     * @param data
     * @param params
     * @returns
     */
    add(data: DataInput, table: string): Query;
    add<M = Model extends undefined ? unknown : Model>(
        data: DataInput,
        params: AddQueryParams<Model extends undefined ? M : Model>
    ): Query;
    add<M = Model extends undefined ? unknown : Model>(
        data: DataInput,
        params?: AddQueryParams<Model extends undefined ? M : Model> | string
    ) {
        const add = buildUpdateInsertQuery(
            'INSERT',
            data,
            typeof params === 'string' ? undefined : params?.columns,
            typeof params === 'string' ? params : params?.table || this.table
        );
        const query = concatenateQuery([
            add,
            {
                type: 'CONFLICT',
                query: typeof params === 'string' ? undefined : params?.conflict
            },
            {
                type: 'RETURNING',
                query:
                    typeof params === 'string' ? undefined : params?.returning
            }
        ]);
        return new Query(this.client.any, this.isBatch, query, {
            command: 'INSERT',
            table: this.table,
            log: this.options.query
        });
    }

    /**
     * Builds UPDATE query
     * @param data
     * @param filter
     * @param params
     * @returns
     */
    update<M = Model extends undefined ? unknown : Model>(
        data: DataInput,
        params?: UpdateQueryParams<Model extends undefined ? M : Model>
    ): Query {
        let update = buildUpdateInsertQuery(
            'UPDATE',
            data,
            params?.columns,
            params?.table || this.table
        );

        // add WHERE for updating multiple records
        if (Array.isArray(data)) {
            update = update + ' WHERE v.id = t.id';
        }

        const query = concatenateQuery([
            update,
            {
                type: 'WHERE',
                query: buildFilters(params?.filter, params?.table || this.table)
            },
            { type: 'RETURNING', query: params?.returning }
        ]);
        return new Query(this.client.any, this.isBatch, query, {
            command: 'UPDATE',
            table: this.table,
            log: this.options.query
        });
    }

    /**
     * Executes multiple queries with a single connection pool.
     * @param callback
     * Queries that should be executed.
     * @returns
     */
    batch<T = void>(callback: BatchQueryCallback<T>) {
        const trx = new PostgresBatchQuery(this.client, this.options);
        return trx.executeBatch<T>(callback);
    }

    /**
     * Initiates a new SQL transaction.
     * A SQL transaction is a grouping of one or more SQL statements that interact with a database.
     * A transaction in its entirety can commit to a database as a single logical unit or rollback (become undone) as a single logical unit.
     * @param callback
     * Queries that should be executed.
     * @returns
     */
    transaction<T>(callback: BatchQueryCallback<T>) {
        const trx = new PostgresBatchQuery(this.client, this.options);
        return trx.executeTransaction<T>(callback);
    }
}
