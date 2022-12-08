import pgPromise from 'pg-promise';
import { filterOperators } from './filter';

// Client
export type DatabaseConnConfig = {
    host: string | undefined;
    port: number | undefined;
    database: string | undefined;
    user: string | undefined;
    password: string;
};

// Query
export type QueryInputFormat = string | pgPromise.QueryFile;
export type FindQueryParams = {
    query: QueryInputFormat;
    filter?: string;
    params?: Record<string, unknown>;
};
export type UpdateQueryParams = {
    data: Record<string, unknown>;
    filter?: string;
    columns?: string[];
    returning?: QueryInputFormat;
};
export type CreateQueryParams = {
    data: Record<string, unknown>;
    columns?: string[];
    returning?: QueryInputFormat;
    conflict?: QueryInputFormat;
    table?: string;
};
export type QueryCommands = 'SELECT' | 'UPDATE' | 'CREATE';
export type QueryReturnMode = 'MANY' | 'ONE' | 'ANY';
export type QueryClauses = 'WHERE' | 'RETURNING' | 'CONFLICT';
export type ClientInitOptions = {
    testConnection?: boolean;
    error?: {
        query?: CustomQueryError;
        connect?: CustomConnectError;
    };
};

export type QueryConnectArgs = {
    message: string;
};

export type ChainQueryObject = {
    type: QueryClauses;
    query: QueryInputFormat | undefined;
};

// Filters
export type FilterOperatorParams = {
    column: string | number | symbol;
    value: unknown;
    alias: string;
};
export type FilterOperators = keyof typeof filterOperators;

// Errors
export type CustomQueryError = (err: QueryErrorArgs) => void;
export type CustomConnectError = (
    err: QueryConnectArgs,
    connection: DatabaseConnConfig
) => void;
export type QueryErrorArgs = {
    table: string | undefined;
    command: QueryCommands | undefined;
    message: string;
    hint: string;
    position: number;
    query: string;
    cause: Error;
};
