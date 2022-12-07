import pgPromise, { IDatabase } from 'pg-promise';
import chalk from 'chalk';
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

    constructor(
        connection: pg.IConnectionParameters<pg.IClient>,
        options:
            | pgPromise.IInitOptions<Record<string, unknown>, pg.IClient>
            | undefined = {}
    ) {
        // init
        const pgp = pgPromise(options);
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
        this.testConnection();

        // query execution
        this.query = {
            many: (query: Query) => this.runQuery(query),
            single: (query: Query) => this.runQuery(query)
        };
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

    async runQuery(query: Query) {
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
