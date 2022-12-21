import pgPromise, { IDatabase } from 'pg-promise';
import chalk from 'chalk';
import pg from 'pg-promise/typescript/pg-subset';

import PostgresQuery from './query';
import type {
    DatabaseConnConfig,
    QueryInputFormat,
    ClientInitOptions,
    ConnectionStatusReturn
} from './types';

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
        // this.Suite: PostgresQuery;
    }

    /**
     * Tests if connection to database can be established
     */
    async status(log = true): Promise<ConnectionStatusReturn> {
        try {
            const connection = await this.db.connect();
            const { client } = connection;
            connection.done(true);
            this.connectionSuccess = true;
            if (log) {
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
            if (log) {
                console.error(
                    chalk.red(`Database Connection failed (${err.message})`)
                );
                console.error(
                    `User\t\t${this.connectionConfig.user}\nHost\t\t${this.connectionConfig.host}\nPort\t\t${this.connectionConfig.port}\nDatabase\t${this.connectionConfig.database}`
                );
            }
            return {
                status: 'FAILED',
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

    // Suite() {
    //     return {
    //         filterSets: 222,
    //         columnSets: 333
    //     };
    // }

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
