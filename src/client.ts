import pgPromise, { IDatabase } from 'pg-promise';
import chalk from 'chalk';
import pg from 'pg-promise/typescript/pg-subset';

import PostgresQuery from './query';
import type {
    DatabaseConnConfig,
    ClientInitOptions,
    ConnectionStatus,
    ConnectionStatusParams
} from './types';
import QuerySuite from './suite';

export default class PostgresClient {
    private db: IDatabase<Record<string, unknown>, pg.IClient>;
    private connectionStatus: ConnectionStatus;
    private initOptions: ClientInitOptions;
    private connectionConfig: DatabaseConnConfig;
    query: PostgresQuery;

    constructor(
        connection: pg.IConnectionParameters<pg.IClient>,
        options: ClientInitOptions = {
            connect: { onInit: true }
        }
    ) {
        // init
        const pgp = pgPromise();
        this.db = pgp(connection);
        this.initOptions = options;

        this.connectionConfig = {
            host: connection.host,
            user: connection.user,
            port: connection.port,
            database: connection.database,
            password: '##########' // hide password
        };

        this.connectionStatus = {
            status: 'DISCONNECTED',
            connection: this.connectionConfig
        };

        // test connection
        if (options?.connect?.onInit) {
            this.connect();
        }

        // query execution
        this.query = new PostgresQuery(this.db, {
            queryError: options.query?.error
        });
    }

    async connect() {
        try {
            const connection = await this.db.connect();
            this.connectionStatus.status = 'CONNECTED';
            connection.done(true);
        } catch (e: any) {
            this.connectionStatus.message = e.message;
            this.connectionStatus.status = 'FAILED';
        }
    }

    /**
     * Tests if connection to database can be established
     */
    async status(): Promise<ConnectionStatus> {
        return this.connectionStatus;

        try {
            const connection = await this.db.connect();
            const { client } = connection;
            connection.done(true);
            // if (options.logging) {
            //     console.log(
            //         chalk.green(
            //             `Connected to Database "${client.database}" on ${client.host}:${client.port} with user "${client.user}"`
            //         )
            //     );
            // }
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
            // if (options.logging) {
            //     console.error(
            //         chalk.red(`Database Connection failed (${err.message})`)
            //     );
            //     console.error(`Host\t\t${this.connectionConfig.host}`);
            //     console.error(`Port\t\t${this.connectionConfig.port}`);
            //     console.error(`Database\t${this.connectionConfig.database}`);
            //     console.error(`User\t\t${this.connectionConfig.user}`);
            //     console.error(`Password\t${this.connectionConfig.password}`);
            // }
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
     * Creates Query Suite which simplifies queries and incorporates types
     * @param table
     * @returns query and config methods
     */
    newQuerySuite<M>(table: string) {
        const query = new PostgresQuery(this.db, {
            queryError: this.initOptions.query?.error,
            table
        });

        const suite = new QuerySuite<M>(table);
        return {
            config: suite,
            query
        };
    }

    /**
     * Closes the connection
     */
    async close() {
        await this.db.$pool.end();
    }
}
