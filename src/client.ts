import pgPromise, { IDatabase } from 'pg-promise';
import chalk from 'chalk';
import pg from 'pg-promise/typescript/pg-subset';

import PostgresQuery from './query';
import type {
    QuerySuiteConfig,
    QuerySuite,
    DatabaseConnConfig,
    ClientInitOptions,
    ConnectionStatusReturn,
    ConnectionStatusParams
} from './types';
import PostgresQuerySuite from './suite';

export default class PostgresClient {
    private db: IDatabase<Record<string, unknown>, pg.IClient>;
    connectionConfig: DatabaseConnConfig;
    connectionSuccess: boolean;
    query: PostgresQuery;

    constructor(
        connection: pg.IConnectionParameters<pg.IClient>,
        options: ClientInitOptions = {
            testConnection: false
        }
    ) {
        // init
        const pgp = pgPromise();
        this.db = pgp(connection);

        // test connect
        this.connectionSuccess = false;
        this.connectionConfig = {
            host: connection.host,
            user: connection.user,
            port: connection.port,
            database: connection.database,
            password: '##########' // hide password
        };
        if (options?.testConnection) {
            this.status();
        }

        // query execution
        this.query = new PostgresQuery(this.db, options.error?.query);
    }

    /**
     * Tests if connection to database can be established
     */
    async status(
        options: ConnectionStatusParams = { logging: true }
    ): Promise<ConnectionStatusReturn> {
        try {
            const connection = await this.db.connect();
            const { client } = connection;
            connection.done(true);
            this.connectionSuccess = true;
            if (options.logging) {
                console.log(
                    chalk.green(
                        `Connected to Database "${client.database}" on ${client.host}:${client.port} with user "${client.user}"`
                    )
                );
            }
            return {
                status: 'CONNECTED',
                connection: {
                    host: this.connectionConfig.host,
                    port: this.connectionConfig.port,
                    database: this.connectionConfig.database,
                    user: this.connectionConfig.user,
                    password: this.connectionConfig.password
                }
            };
        } catch (err: any) {
            if (options.logging) {
                console.error(
                    chalk.red(`Database Connection failed (${err.message})`)
                );
                console.error(`Host\t\t${this.connectionConfig.host}`);
                console.error(`Port\t\t${this.connectionConfig.port}`);
                console.error(`Database\t${this.connectionConfig.database}`);
                console.error(`User\t\t${this.connectionConfig.user}`);
                console.error(`Password\t${this.connectionConfig.password}`);
            }
            return {
                status: 'FAILED',
                message: err.message,
                connection: {
                    host: this.connectionConfig.host,
                    port: this.connectionConfig.port,
                    database: this.connectionConfig.database,
                    user: this.connectionConfig.user,
                    password: this.connectionConfig.password
                }
            };
        }
    }

    /**
     * Configures and exposes a new QuerySuite
     */
    createQuerySuite<M>(table: string) {
        return <C extends QuerySuiteConfig<M>>(config: C): QuerySuite<M, C> => {
            const suite = new PostgresQuerySuite<M>(table, config);

            return {
                table: suite.table,
                columns: suite.columns,
                queries: suite.queries
            } as any;
        };
    }
}
