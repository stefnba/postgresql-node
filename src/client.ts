import pgPromise from 'pg-promise';
import chalk from 'chalk';

import PostgresQuery from './query';
import { ConnectionErrorTypes } from './constants';

import DatabaseRepository from './repository';
import type {
    DatabaseConnection,
    DatabaseStatus,
    RegisteredRepositories,
    Database,
    DatabaseOptions,
    DatabaseConnectionError,
    QueryInit
} from './types';

export default class PostgresClient {
    readonly db: Database;
    readonly query: QueryInit;
    private _status: DatabaseStatus;
    private options: DatabaseOptions;

    constructor(connection: DatabaseConnection, options: DatabaseOptions) {
        const pgp = pgPromise();
        this.db = pgp(connection);

        this.options = {
            ...options,
            connect: {
                testOnInit: true,
                logConnect: true,
                ...options.connect
            }
        };

        this._status = {
            status: 'INIT',
            connection: {
                ...connection,
                password: '##########' // hide password
            }
        };

        this.query = PostgresQuery.init(this.db, this.options);

        // test if connection can be established
        if (this.options.connect?.testOnInit) {
            (async () => {
                await this.connect();
            })();
        }
    }

    queryInit(table: string) {
        return PostgresQuery.init(this.db, this.options, table);
    }

    // find = new PostgresQuery(this.db, this.options, 'find');

    /**
     * Attempts to establish connection to database
     * @returns
     */
    async connect() {
        return this.db
            .connect()
            .then((c) => {
                c.done(true);
                this._status.status = 'CONNECTED';

                // log or return onSuccess
                if (this.options?.connect?.onSuccess) {
                    this.options?.connect?.onSuccess(this._status.connection);
                } else if (this.options?.connect?.logConnect) {
                    const { host, database, user, port } =
                        this._status.connection;
                    console.log(
                        chalk.green(
                            `Connected to Database "${database}" on ${host}:${port} with user "${user}"`
                        )
                    );
                }
                return this.status();
            })
            .catch((err) => {
                const code = err.code as string;
                const error: DatabaseConnectionError = {
                    code: err.code,
                    // error: ConnectionErrorTypes[code],
                    error: ConnectionErrorTypes.ECONNREFUSED,
                    message: err.message
                };

                // status
                this._status.status = 'FAILED';
                this._status.error = error;

                // log or return onFailed
                if (this.options?.connect?.onFailed) {
                    this.options?.connect?.onFailed(
                        error,
                        this._status.connection
                    );
                } else if (this.options?.connect?.logConnect) {
                    const { host, database, user, port } =
                        this._status.connection;
                    console.error(
                        chalk.red(`DB connection failed (${err.message})`)
                    );
                    console.error(`Host\t\t${host}`);
                    console.error(`Port\t\t${port}`);
                    console.error(`Database\t${database}`);
                    console.error(`User\t\t${user}`);
                }

                return this.status();
            });
    }

    /**
     *
     * @returns
     * Status of database connection
     */
    status() {
        return this._status;
    }

    /**
     * Extends PostgresClient with custom respositories that can be used throughout the application
     * @param databaseRespos
     * Respositories as key-value pairs
     * @returns
     * Instantiated respositories
     */
    registerRepositories<R extends Record<string, typeof DatabaseRepository>>(
        databaseRespos: R
    ): RegisteredRepositories<R> {
        return Object.entries(databaseRespos).reduce((acc, [key, Repo]) => {
            console.log(Repo.prototype);
            const query = PostgresQuery.init(this.db, this.options);
            const queryInit = this.queryInit;
            const repo = new Repo(this.db, query);

            console.log(repo);

            return {
                ...acc,
                [key]: repo
            };
        }, {}) as RegisteredRepositories<R>;
    }
}
