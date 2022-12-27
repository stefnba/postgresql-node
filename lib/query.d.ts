import { IDatabase } from 'pg-promise';
import pg from 'pg-promise/typescript/pg-subset';
import type { QueryInputFormat, FindOneQueryParams, FindManyQueryParams, QueryReturnMode, CreateOneQueryParams, UpdateOneQueryParams, UpdateManyQueryParams, CreateManyQueryParams, QueryInitConfig } from './types';
export default class PostgresQuery {
    private client;
    private customQueryError;
    private table;
    constructor(client: IDatabase<Record<string, unknown>, pg.IClient>, config: QueryInitConfig);
    /**
     * Run a SELECT query that returns a single record
     */
    findOne<R>(params: FindOneQueryParams): Promise<R>;
    /**
     * Run a SELECT query that returns multiple record
     */
    findMany<R>(params: FindManyQueryParams): Promise<R[]>;
    /**
     * Run a UPDATE query that changes a single record
     */
    updateOne<R>(params: UpdateOneQueryParams): Promise<R>;
    /**
     * Run a UPDATE query that changes multiple records
     */
    updateMany<R>(params: UpdateManyQueryParams): Promise<R[]>;
    /**
     * Run a CREATE query
     */
    createOne<R>(params: CreateOneQueryParams): Promise<R>;
    /**
     * Run a CREATE query that creates multiple records
     */
    createMany<R>(params: CreateManyQueryParams): Promise<R[]>;
    /**
     * Executes any query
     */
    run<R>(query: QueryInputFormat, params?: Record<string, unknown>, mode?: QueryReturnMode): Promise<R>;
    /**
     * Initiate a transaction
     */
    transaction(): Promise<{
        <T = any>(cb: (t: import("pg-promise").ITask<Record<string, unknown>> & Record<string, unknown>) => T | Promise<T>): Promise<T>;
        <T_1 = any>(tag: string | number, cb: (t: import("pg-promise").ITask<Record<string, unknown>> & Record<string, unknown>) => T_1 | Promise<T_1>): Promise<T_1>;
        <T_2 = any>(options: {
            tag?: any;
            mode?: {
                begin(cap?: boolean | undefined): string;
            } | null | undefined;
        }, cb: (t: import("pg-promise").ITask<Record<string, unknown>> & Record<string, unknown>) => T_2 | Promise<T_2>): Promise<T_2>;
    }>;
    /**
     * Central method that executes all queries
     */
    private execute;
    /**
     * Throws QueryError directly or customQueryError if method is provided upon setup
     * @param options
     * @returns
     */
    private throwError;
}
