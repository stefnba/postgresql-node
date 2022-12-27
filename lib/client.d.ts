import pg from 'pg-promise/typescript/pg-subset';
import PostgresQuery from './query';
import type { DatabaseConnConfig, ClientInitOptions, ConnectionStatusReturn, ConnectionStatusParams } from './types';
import QuerySuite from './suite';
export default class PostgresClient {
    private db;
    private initOptions;
    connectionConfig: DatabaseConnConfig;
    connectionSuccess: boolean;
    query: PostgresQuery;
    constructor(connection: pg.IConnectionParameters<pg.IClient>, options?: ClientInitOptions);
    /**
     * Tests if connection to database can be established
     */
    status(options?: ConnectionStatusParams): Promise<ConnectionStatusReturn>;
    /**
     * Creates Query Suite which simplifies queries and incorporates types
     * @param table
     * @returns query and config methods
     */
    newQuerySuite<M>(table: string): {
        config: QuerySuite<M>;
        query: PostgresQuery;
    };
}
