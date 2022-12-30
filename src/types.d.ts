import pgPromise, { QueryFile } from 'pg-promise';
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
export type ConnectionStatus = {
    status: 'CONNECTED' | 'FAILED' | 'CONNECTING' | 'DISCONNECTED';
    message?: string;
    connection: DatabaseConnConfig;
};
export type ConnectionStatusParams = {
    logging: boolean;
};
export type ClientInitOptions = {
    connect?: {
        onInit?: boolean;
        error?: CustomConnectError;
    };
    query?: {
        error?: CustomQueryError;
    };
};

// Query
export type QueryInitConfig = {
    queryError?: CustomQueryError;
    table?: string;
};
export type QueryInputFormat = string | pgPromise.QueryFile;
export type FindOneQueryParams = {
    query: QueryInputFormat;
    filter?: string;
    params?: Record<string, unknown>;
};
export type FindManyQueryParams = FindOneQueryParams & {
    pagination?: PaginationParams;
};
export type CreateOneQueryParams = {
    table?: string;
    conflict?: QueryInputFormat;
    data: Record<string, unknown>;
    columns: ColumnSet;
    returning?: QueryInputFormat;
};
export type UpdateOneQueryParams = CreateOneQueryParams & {
    filter?: string;
};
export type UpdateManyQueryParams = Omit<UpdateOneQueryParams, 'data'> & {
    data: Array<Record<string, unknown>>;
};
export type CreateManyQueryParams = Omit<CreateOneQueryParams, 'data'> & {
    data: Array<Record<string, unknown>>;
};

export type QueryCommands = 'SELECT' | 'UPDATE' | 'CREATE';
export type QueryReturnMode = 'MANY' | 'ONE' | 'ANY';
export type QueryClauses =
    | 'WHERE'
    | 'RETURNING'
    | 'CONFLICT'
    | 'LIMIT'
    | 'OFFSET';

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
export type PaginationParams = {
    page: number;
    pageSize?: number;
};

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

// QuerySuite
export type ColumnSetsParams<M> = Record<string, ColumnSet<M>>;
export type ColumnSets<T> = Record<keyof T, ColumnSet>;
export type QuerySetsParams = Record<string, string>;
export type QuerySets<T> = Record<keyof T, QueryFile>;
export type FilterSetsParams<M> = Record<
    string,
    | { column: keyof M; operator: FilterOperators; alias?: string }
    | FilterOperators
>;

// ColumnSets
export type ColumnSet<M = undefined> = M extends undefined
    ? Array<string | { name: string; optional: boolean }>
    : Array<
          | { name: keyof M; optional: boolean }
          | keyof M
          | `${string & keyof M}?`
      >;
