import pgPromise from 'pg-promise';
import { QueryErrorCodes } from './constants';
import { filterOperators } from './filter';

// Client
export type DatabaseConnConfig = {
    host: string | undefined;
    port: number | undefined;
    database: string | undefined;
    user: string | undefined;
    password: string;
};
export type ConnectionStatusReturn = {
    status: 'CONNECTED' | 'FAILED' | 'CONNECTING';
    message?: string;
    connection: DatabaseConnConfig;
};
export type ConnectionStatusParams = {
    logging: boolean;
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
    table?: string;
};
export type CreateQueryParams = {
    data: Record<string, unknown> | Record<string, unknown>[];
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

// Pagination

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
    hint?: string;
    query: string;
    code: QueryErrorCodes;
    position?: number;
    cause?: Error;
};

// Suite setup
export type QuerySuiteConfig<M> = {
    querySets?: QueryFileArgs;
    columnSets?: ColumnSetsInput<M>;
    filterSets?: FilterArgs<M>;
};
export type QueryFileArgs = {
    path: string | Array<string>;
    queries: Record<string, string>;
};
export type ColumnSetsInput<M> = Record<string, Array<keyof M>>;
export type QuerySetsInput = {
    path: string | Array<string>;
    queries: Record<string, string>;
};
export type FilterArgs<M> = Record<string, keyof M>;

// Suite
export type QuerySuite<M, T extends QuerySuiteConfig<M>> = {
    /**
     * Table name
     */
    table: { name: string; columns: keyof M };
    /**
     * Available columns
     */
    columns: Record<keyof T['columnSets'], string>;
    /**
     * Available queries
     */
    queries: T['querySets'] extends QueryFileArgs
        ? Record<keyof T['querySets']['queries'], QueryInputFormat>
        : never;

    /**
     *
     */
    run: string;
};
export type QuerySuiteColumns = Record<string, string>;
