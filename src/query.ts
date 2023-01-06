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
import { QueryError } from './error';

export default class PostgresQuery {
    table?: string;
    private queryClient: string;

    find: ReturnType<typeof query<FindQueryParams>>;
    update: ReturnType<typeof query<UpdateQueryParams>>;
    add: ReturnType<typeof query<AddQueryParams>>;
    run: ReturnType<typeof query<RunQueryParams>>;

    transaction: BatchQuery;
    batch: BatchQuery;

    constructor(
        client: Database | TransactionClient,
        options: DatabaseOptions,
        table?: string
    ) {
        this.table = table;
        this.queryClient = client.constructor.name;

        this.find = query<FindQueryParams>(client, options, 'SELECT', table);
        this.update = query<UpdateQueryParams>(
            client,
            options,
            'UPDATE',
            table
        );
        this.add = query<AddQueryParams>(client, options, 'INSERT', table);
        this.run = query<RunQueryParams>(client, options, 'RUN', table);

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

function query<
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
    async function one<R>(params: P): Promise<R>;
    async function one<R>(query: string, params?: object): Promise<R>;
    async function one<R>(params: P | string): Promise<R> {
        const result = await executeQuery(
            client,
            options,
            command,
            params,
            table
        );
        if (Array.isArray(result)) {
            if (result.length === 1) {
                return result[0];
            }
            throw new QueryError({
                table,
                command,
                message: 'QueryResultError',
                query: ''
            });
        }
        return result;
    }

    async function many<R>(params: P): Promise<R[]>;
    async function many<R>(query: string, params?: object): Promise<R[]>;
    async function many<R>(params: P | string): Promise<R[]> {
        const result = await executeQuery(
            client,
            options,
            command,
            params,
            table
        );
        return result;
    }

    async function none(params: P): Promise<void>;
    async function none(query: string, params?: object): Promise<void>;
    async function none(params: P | string): Promise<void> {
        await executeQuery(client, options, command, params, table);
    }

    return {
        one,
        many,
        none
    };
}
