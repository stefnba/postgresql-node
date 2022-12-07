import pgPromise from 'pg-promise';

export type DatabaseConnConfig = {
    host: string | undefined;
    port: number | undefined;
    database: string | undefined;
    user: string | undefined;
    password: string;
};

export type Query = string | pgPromise.QueryFile;
