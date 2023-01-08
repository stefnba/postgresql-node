import { IDatabase, ITask, QueryFile } from 'pg-promise';

import { ConnectionError } from './error';
import PostgresQuery from './query';
import { filterOperators } from './filter';
import DatabaseRepository from './repository';

export type Database = IDatabase<object>;

export type DatabaseConnectionParams = {
    host?: string;
    port?: number;
    database: string;
    user: string;
    password: string;
};

export type DatabaseConnectionStatus = {
    status: 'CONNECTED' | 'FAILED' | 'DISCONNECTED';
    serverVersion?: string;
    connection: DatabaseConnectionParams;
    error?: ConnectionErrorPublic;
};

export type ConnectionEventSuccessParams = Omit<
    DatabaseConnectionStatus,
    'error'
>;
export type ConnectionEventFailParams = Omit<
    DatabaseConnectionStatus,
    'serverVersion'
>;

export type DatabaseOptions = {
    connect?: {
        testOnInit?: boolean;
        log?: boolean;
        onSuccess?: (connection: ConnectionEventSuccessParams) => void;
        onFailed?: (connection: ConnectionEventFailParams) => void;
    };
    query?: {
        onError?: (error: { message: string }, query: string) => void;
        onReturn?: (result: Array<object> | object, query: string) => void;
    };
    noWarnings?: boolean;
};

// Repositories

export type RegisterRepositoriesParams = Record<
    string,
    typeof DatabaseRepository<never>
>;
export type RegisteredRepositories<R extends RegisterRepositoriesParams> = {
    [Key in keyof R]: Repository<InstanceType<R[Key]>>;
};
export type Repository<R> = Omit<
    R,
    'table' | 'columns' | 'filters' | 'query' | 'queries'
>;

// Errors
export type QueryErrorArgs = {
    message: string;
    table?: string;
    command?: QueryExecutionCommands;
    hint?: string;
    query?: string;
};

export type QueryExecutionErrorArgs = QueryErrorArgs & {
    cause: PostgresErrorObject;
};

export type ConnectionErrorArgs = {
    connection: DatabaseConnectionParams;
    message: string;
    cause: PostgresErrorObject;
};

export type QueryBuildErrorParams = QueryErrorArgs & {
    type: 'TableMissing' | 'EmptyQuery';
};

export type QueryResultErrorParams = QueryErrorArgs & {
    type: 'OneRecordViolation';
};

export type ConnectionErrorPublic = Pick<
    ConnectionError,
    'code' | 'message' | 'type'
>;

export type PostgresErrorObject = Error & {
    code: string;
    detail?: string;
    hint?: string;
    length?: number;
    severity?: string;
    schema?: string;
    table?: string;
    column?: string;
    constraint?: string;
    dataType?: string;
    routine?: string;
    query?: string;
};

// Query
export type QueryInput = string | QueryFile;
export type QueryCommands = 'SELECT' | 'UPDATE' | 'INSERT';
export type QueryExecutionCommands = QueryCommands | 'RUN';
export type QueryInserUpdateCommands = 'UPDATE' | 'INSERT';
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

export type BatchQuery = <R>(
    callback: BatchQueryCallback<R>
) => unknown | Promise<unknown>;

export type TransactionClient = ITask<object>;

export type BatchQueryCallback<R = any> = (t: PostgresQuery) => Promise<R>;

export type FindQueryParams = {
    query: QueryInput;
    params?: object;
    filter?: string;
    pagination?: Pagination;
};

export type RunQueryParams = {
    query: QueryInput;
    params?: object;
};

export type Pagination = {
    page: number;
    pageSize?: number;
};

export type AddQueryParams<M = undefined> = {
    data: object | object[];
    columns?: ColumnSetParams<M>;
    params?: object;
    returning?: QueryInput;
    table?: string;
    conflict?: string;
};

export type UpdateQueryParams<M = undefined> = AddQueryParams<M> & {
    filter?: object;
};

// Filters
export type FilterOperators = keyof typeof filterOperators;
export type FilterOperatorParams = {
    column: string | number | symbol;
    value: unknown;
    alias: string;
};

export type FilterSet<M> = Record<
    string,
    | FilterOperators
    | { column: keyof M; operator: FilterOperators; alias?: string }
>;

export type ColumnSetParams<M = undefined> = M extends undefined
    ? Array<string | { name: string; optional: boolean }>
    : Array<
          | { name: keyof M; optional: boolean }
          | keyof M
          | `${string & keyof M}?`
      >;
