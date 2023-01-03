import { IDatabase, QueryFile } from 'pg-promise';
import { QueryErrorTypes, ConnectionErrorTypes } from './constants';
import PostgresQuery from './query';
import DatabaseRepository from './repository';

export type Database = IDatabase<object>;

export type DatabaseConnection = {
    host?: string;
    port?: number;
    database: string;
    user: string;
    password: string;
};

export type DatabaseStatus = {
    status: 'CONNECTED' | 'FAILED' | 'INIT';
    connection: DatabaseConnection;
    error?: DatabaseConnectionError;
};

export type DatabaseOptions = {
    connect?: {
        testOnInit?: boolean;
        logConnect?: boolean;
        onSuccess?: (connection: DatabaseConnection) => void;
        onFailed?: (
            error: DatabaseConnectionError,
            connection: DatabaseConnection
        ) => void;
    };
    query?: {
        onError?: () => void;
        onReturn?: () => void;
    };
};

export type DatabaseConnectionError = {
    message: string;
    code: string;
    error: ConnectionErrorTypes;
    hint?: string;
};

// Repositories
export type RegisteredRepositories<
    T extends Record<string, R>,
    R extends DatabaseRepository
> = {
    [Properties in keyof T]: Omit<
        T[Properties],
        'queryInit' | 'filters' | 'queries' | 'columns' | 'table' | 'query'
    >;
};

// Errors
export type QueryErrorArgs = {
    table: string | undefined;
    command: QueryCommands | undefined;
    message: string;
    hint?: string;
    query: string;
    type: QueryErrorTypes;
    position?: number;
    cause?: Error & { code?: string };
};

export type ConnectionErrorArgs = {
    connection: DatabaseConnection;
    message: string;
};

// Query
export type QueryInput = string | QueryFile;
export type QueryCommands = 'SELECT' | 'UPDATE' | 'INSERT';
export type QueryClauses =
    | 'WHERE'
    | 'RETURNING'
    | 'CONFLICT'
    | 'LIMIT'
    | 'OFFSET'
    | 'ORDER';
export type QueryConcatenationParams = Array<
    | QueryInput
    | {
          type: QueryClauses;
          query?: QueryInput;
      }
>;

export type QueryInit = {
    find: PostgresQuery<FindQueryParams>;
    add: PostgresQuery<AddQueryParams>;
    update: PostgresQuery<UpdateQueryParams>;
};

export type FindQueryParams = {
    query: QueryInput;
    params?: object;
    filter?: object;
};

export type AddQueryParams = {
    data: object | object[];
    columns?: Array<string>;
    params?: object;
    returning?: QueryInput;
    table?: string;
};

export type UpdateQueryParams = AddQueryParams & {
    filter?: object;
};

// Filters
export type FilterOperatorParams = {
    column: string | number | symbol;
    value: unknown;
    alias: string;
};
