import pgPromise from 'pg-promise';

export type CleanedConnection = {
    host: string | undefined;
    port: number | undefined;
    user: string | undefined;
    database: string | undefined;
};

export type Query = string | pgPromise.QueryFile;
