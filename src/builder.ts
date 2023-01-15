import PostgresBatchQuery from './batch';
import {
    Database,
    DatabaseOptions,
    FindQueryParams,
    AddQueryParams,
    UpdateQueryParams,
    DataInput,
    BatchQueryCallback,
    TransactionClient,
    QueryInput
} from './types';
import Query from './query';

import { concatenateQuery, pgFormat, buildUpdateInsertQuery } from './utils';
import pagination from './pagination';
import { buildFilters } from './filter';

/**
 * Simplifies construction of pg queries.
 */
export default class QueryBuilder {
    private client: Database | TransactionClient;
    private table?: string;
    private options: DatabaseOptions;

    constructor(
        client: Database | TransactionClient,
        options: DatabaseOptions,
        table?: string
    ) {
        this.table = table;
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
    find<M>(query: QueryInput, params?: FindQueryParams<M>) {
        const _query = concatenateQuery([
            pgFormat(query, params?.params),
            { type: 'WHERE', query: buildFilters(params?.filter) },
            { query: pagination.pageSize(params?.pagination), type: 'LIMIT' },
            { query: pagination.page(params?.pagination), type: 'OFFSET' }
        ]);

        return new Query(this.client.any, _query, {
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
        return new Query(this.client.any, pgFormat(query, params), {
            command: 'RUN',
            log: this.options.query,
            table: this.table
        });
    }

    /**
     * Builds INSERT query
     * @param data
     * @param params
     * @returns
     */
    add<M>(data: DataInput, params?: AddQueryParams<M>) {
        const add = buildUpdateInsertQuery(
            'INSERT',
            data,
            params?.columns,
            params?.table || this.table
        );
        const query = concatenateQuery([
            add,
            { type: 'CONFLICT', query: params?.conflict },
            { type: 'RETURNING', query: params?.returning }
        ]);
        return new Query(this.client.any, query, {
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
    update<M>(data: DataInput, params?: UpdateQueryParams<M>): Query {
        const update = buildUpdateInsertQuery(
            'UPDATE',
            data,
            params?.columns,
            params?.table || this.table
        );

        const query = concatenateQuery([
            update,
            {
                type: 'WHERE',
                query: buildFilters(params?.filter, params?.table || this.table)
            },
            { type: 'RETURNING', query: params?.returning }
        ]);
        return new Query(this.client.any, query, {
            command: 'UPDATE',
            table: this.table,
            log: this.options.query
        });
    }

    /**
     *
     * @param callback
     * @returns
     */
    batch(callback: BatchQueryCallback) {
        const trx = new PostgresBatchQuery(this.client, this.options);
        return trx.executeBatch(callback);
    }

    /**
     *
     * @param callback
     * @returns
     */
    transaction(callback: BatchQueryCallback) {
        const trx = new PostgresBatchQuery(this.client, this.options);
        return trx.executeTransaction(callback);
    }
}
