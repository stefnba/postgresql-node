import PostgresBatchQuery from './batch';
import {
    Database,
    DatabaseOptions,
    FindQueryParams,
    AddQueryParams,
    UpdateQueryParams,
    RunQueryParams,
    BatchQueryCallback,
    TransactionClient,
    QueryExecutionCommands,
    BatchQuery
} from './types';
import executeQuery from './execution';
import { QueryError, QueryResultError } from './error';
import { QueryFile } from 'pg-promise';

/**
 *
 */
export default class PostgresQuery {
    table?: string;
    private queryClient: string;

    find: ReturnType<typeof queryReturn<FindQueryParams>>;
    update: ReturnType<typeof queryReturn<UpdateQueryParams>>;
    add: ReturnType<typeof queryReturn<AddQueryParams>>;
    run: ReturnType<typeof queryReturn<RunQueryParams>>;

    transaction: BatchQuery;
    batch: BatchQuery;

    constructor(
        client: Database | TransactionClient,
        options: DatabaseOptions,
        table?: string
    ) {
        this.table = table;
        this.queryClient = client.constructor.name;

        this.find = queryReturn<FindQueryParams>(
            client,
            options,
            'SELECT',
            table
        );
        this.update = queryReturn<UpdateQueryParams>(
            client,
            options,
            'UPDATE',
            table
        );
        this.add = queryReturn<AddQueryParams>(
            client,
            options,
            'INSERT',
            table
        );
        this.run = queryReturn<RunQueryParams>(client, options, 'RUN', table);

        this.transaction = (callback: BatchQueryCallback) => {
            const trx = new PostgresBatchQuery(client, options);
            return trx.executeTransaction(callback);
        };
        this.batch = (callback: BatchQueryCallback) => {
            const trx = new PostgresBatchQuery(client, options);
            return trx.executeBatch(callback);
        };
    }
}

/**
 *
 * @param client
 * @param options
 * @param command
 * @param table
 * @returns
 */
function queryReturn<
    P extends
        | FindQueryParams
        | RunQueryParams
        | AddQueryParams
        | UpdateQueryParams
>(
    client: Database | TransactionClient,
    options: DatabaseOptions,
    command: QueryExecutionCommands,
    table?: string
) {
    /**
     *
     * @param params
     */
    async function one<R>(params: P): Promise<R>;
    async function one<R>(
        query: string | QueryFile,
        params?: object
    ): Promise<R>;
    async function one<R>(
        params: P | string | QueryFile,
        addParams?: object
    ): Promise<R> {
        const result = await executeQuery(
            client,
            options,
            command,
            params,
            table,
            addParams
        );
        if (Array.isArray(result)) {
            if (result.length === 1) {
                return result[0];
            }
            throw new QueryResultError({
                table,
                command,
                type: 'ONE_RECORD_VIOLATION',
                message: 'Multiple records not allowed',
                query: ''
            });
        }
        return result;
    }

    /**
     *
     * @param params
     */
    async function many<R>(params: P): Promise<R[]>;
    async function many<R>(query: string, params?: object): Promise<R[]>;
    async function many<R>(
        params: P | string,
        addParams?: object
    ): Promise<R[]> {
        const result = await executeQuery(
            client,
            options,
            command,
            params,
            table,
            addParams
        );
        return result;
    }

    /**
     *
     * @param params
     */
    async function none(params: P): Promise<void>;
    async function none(query: string, params?: object): Promise<void>;
    async function none(
        params: P | string,
        additionalParams?: object
    ): Promise<void> {
        console.log(additionalParams);
        await executeQuery(
            client,
            options,
            command,
            params,
            table,
            additionalParams
        );
    }

    return {
        one,
        many,
        none
    };
}
