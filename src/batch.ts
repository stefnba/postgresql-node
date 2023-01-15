import QueryBuilder from './builder';
import {
    Database,
    DatabaseOptions,
    BatchQueryCallback,
    TransactionClient
} from './types';

export default class PostgresBatchQuery {
    private db: Database | TransactionClient;
    private options: DatabaseOptions;
    private isTransaction: boolean;

    constructor(db: Database | TransactionClient, options: DatabaseOptions) {
        this.db = db;
        this.options = options;
        this.isTransaction = false;
    }

    private initQuery(t: TransactionClient) {
        return new QueryBuilder(t, this.options);
    }

    async executeTransaction(callback: BatchQueryCallback): Promise<void> {
        this.isTransaction = true;
        return this.db.tx(async (t) => {
            const query = this.initQuery(t);
            return callback(query);
        });
    }

    /**
     * Starts and executes batch query
     * @param callback function
     * Function that contains batch queries which are executed in single connection pool
     * @returns
     */
    async executeBatch(callback: BatchQueryCallback): Promise<void> {
        if (!this.db) throw new Error('Client not defined');

        return this.db
            .task(async (t) => {
                const query = this.initQuery(t);
                return callback(query);
            })
            .then((result) => result)
            .catch((err) => {
                throw err;
            });
    }
}
