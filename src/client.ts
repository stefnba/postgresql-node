import pgPromise, { IDatabase } from 'pg-promise';
import chalk from 'chalk';
import pg from 'pg-promise/typescript/pg-subset';

import PostgresQuery from './query';
import type {
    DatabaseConnConfig,
    QueryInputFormat,
    ClientInitOptions
} from './types';

export default class PostgresClient {
    db: IDatabase<Record<string, unknown>, pg.IClient>;
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
            password: '##########'
        };
        if (options?.testConnection) {
            this.testConnection();
        }

        // query execution
        this.query = new PostgresQuery(this.db, options.error?.query);
    }

    /**
     * Tests if connection to database can be established
     */
    async testConnection() {
        const conn = this.connectionConfig;
        await this.db
            .connect()
            .then((conn) => {
                const { client } = conn;
                console.log(
                    chalk.green(
                        `Connected to Database "${client.database}" on ${client.host}:${client.port} with user "${client.user}"`
                    )
                );
                this.connectionSuccess = true;
                return conn.done(true);
            })
            .catch((err) => {
                console.error(
                    chalk.red(`Database Connection failed (${err.message})`)
                );
                console.error(
                    `User\t\t${conn.user}\nHost\t\t${conn.host}\nPort\t\t${conn.port}\nDatabase\t${conn.database}`
                );
                process.exit(1);
            });
        return this.connectionSuccess;
    }

    async runQuery(query: QueryInputFormat) {
        return this.db
            .oneOrNone(query)
            .then((res) => {
                return res;
            })
            .catch((err) => {
                console.log('EEE', err);
            });
    }
}
