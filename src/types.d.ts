import pgPromise from 'pg-promise';

export type DatabaseConnConfig = {
    host: string | undefined;
    port: number | undefined;
    database: string | undefined;
    user: string | undefined;
    password: string;
};

export type QueryInputFormat = string | pgPromise.QueryFile;

export type FindQueryOptions = {
    filter?: string;
    params?: Record<string, unknown>;
};

export type QueryCommands = 'SELECT' | 'UPDATE' | 'CREATE';
export type QueryReturnMode = 'MANY' | 'ONE' | 'ANY';

export type ClientInitOptions = {
    testConnection?: boolean;
    error?: {
        query?: CustomQueryError;
        connect?: CustomConnectError;
    };
};

export type CustomQueryError = (err: QueryErrorArgs) => void;
export type CustomConnectError = (
    err: QueryConnectArgs,
    connection: DatabaseConnConfig
) => void;
export type QueryErrorArgs = {
    table: string;
    command: QueryCommands | undefined;
    message: string;
    hint: string;
    position: number;
    query: string;
    error: Error;
};
export type QueryConnectArgs = {
    message: string;
};
