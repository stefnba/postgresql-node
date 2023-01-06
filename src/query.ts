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

const query = <P>(
    client: Database | TransactionClient,
    options: DatabaseOptions,
    command: QueryExecutionCommands,
    table?: string
) => {
    return {
        one: async <R>(params: P): Promise<R> => {
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
                throw new Error('');
            }
            return result;
        },
        many: async <R>(params: P): Promise<R[]> => {
            const result = await executeQuery(
                client,
                options,
                command,
                params,
                table
            );
            return result;
        },
        none: async (params: P): Promise<void> => {
            await executeQuery(client, options, command, params, table);
        }
    };
};
