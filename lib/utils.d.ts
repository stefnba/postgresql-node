import pgPromise from 'pg-promise';
import type { QueryInputFormat, ChainQueryObject, QueryClauses } from './types';
export declare const pgHelpers: pgPromise.IHelpers;
/**
 * Format, espaces and integrates parameters into query
 */
export declare const pgFormat: (query: string | pgPromise.QueryFile | pgPromise.ICTFObject, values?: any, options?: pgPromise.IFormattingOptions | undefined) => string;
/**
 * Convers QueryInput (e.g. QueryFile) to string
 * @param qf input query, can either be string or QueryFile
 * @returns Query as string
 */
export declare const queryToString: (qf: QueryInputFormat) => string;
/**
 * Check if query already contains clause; relevant for chaining to work
 * @param q Query
 * @param clause Relevant clause, e.g. WHERE, RETURNING, CONFLICHT
 * @returns true or false
 */
export declare const QueryIncludesClause: (q: QueryInputFormat, clause: QueryClauses) => boolean;
/**
 * Concatenates different parts of query into a single query statement
 * @param queryParts either string (QueryFile not possible) or object
 */
export declare const chainQueryParts: (queryParts: Array<string | ChainQueryObject>) => string;
export declare const buildColumnSet: (columns: (string | {
    name: string;
    optional: boolean;
})[], table?: string | undefined) => pgPromise.ColumnSet<unknown>;
