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
    table: string | undefined;
    command: QueryExecutionCommands | undefined;
    message: string;
    hint?: string;
    query: string;
    position?: number;
    cause?: PostgresErrorObject;
};

export type ConnectionErrorArgs = {
    connection: DatabaseConnectionParams;
    message: string;
    cause: PostgresErrorObject;
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
};

// Query
export type QueryInput = string | QueryFile;
export type QueryCommands = 'SELECT' | 'UPDATE' | 'INSERT';
export type QueryExecutionCommands = QueryCommands | 'RUN';
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
) => void | Promise<void>;
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

export type AddQueryParams = {
    data: object | object[];
    columns?: Array<string>;
    params?: object;
    returning?: QueryInput;
    table?: string;
    conflict?: string;
};

export type UpdateQueryParams = AddQueryParams & {
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
