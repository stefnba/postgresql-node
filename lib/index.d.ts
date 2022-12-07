import pgPromise, { IDatabase } from 'pg-promise';
import pg from 'pg-promise/typescript/pg-subset';
import type { DatabaseConnConfig, Query } from './types';
export default class PostgresClient {
    db: IDatabase<Record<string, unknown>, pg.IClient>;
    connectionConfig: DatabaseConnConfig;
    connectionSuccess: boolean;
    query: {
        many: <R>(query: Query) => Promise<R[]>;
        single: <R>(query: Query) => Promise<R>;
    };
    constructor(connection: pg.IConnectionParameters<pg.IClient>, options?: pgPromise.IInitOptions<Record<string, unknown>, pg.IClient> | undefined);
    /**
     * Tests if connection to database can be established
     */
    testConnection(): Promise<boolean>;
    runQuery(query: Query): Promise<any>;
}
