import pgPromise, { QueryFile } from 'pg-promise';

import type { QueryInputFormat, ChainQueryObject, QueryClauses } from './types';

export const pgHelpers = pgPromise().helpers;

/**
 * Format, espaces and integrates parameters into query
 */
export const pgFormat = pgPromise().as.format;

/**
 * Convers QueryInput (e.g. QueryFile) to string
 * @param qf input query, can either be string or QueryFile
 * @returns Query as string
 */
export const queryToString = (qf: QueryInputFormat): string => {
    if (qf instanceof QueryFile) {
        return pgFormat(qf);
    }
    return qf;
};

/**
 * Check if query already contains clause; relevant for chaining to work
 * @param q Query
 * @param clause Relevant clause, e.g. WHERE, RETURNING, CONFLICHT
 * @returns true or false
 */
export const QueryIncludesClause = (
    q: QueryInputFormat,
    clause: QueryClauses
): boolean => {
    const query = queryToString(q);

    if (query.toLowerCase().includes(clause.toLowerCase())) return true;
    return false;
};

/**
 * Concatenates different parts of query into a single query statement
 * @param queryParts either string (QueryFile not possible) or object
 */
export const chainQueryParts = (
    queryParts: Array<string | ChainQueryObject>
): string => {
    let chainQuery = '';

    queryParts.forEach((queryPart) => {
        // normal string, QueryFile no longer possible here
        if (typeof queryPart === 'string') {
            chainQuery += ` ${queryPart}`;
            return;
        }

        const { query, type } = queryPart;
        if (query === undefined) return;
        if (type === 'RETURNING') {
            if (QueryIncludesClause(chainQuery, type)) {
                chainQuery += ` ${query}`;
            } else {
                chainQuery += ` RETURNING ${query}`;
            }
            return;
        }

        if (type === 'WHERE') {
            if (QueryIncludesClause(chainQuery, type)) {
                chainQuery += ` AND ${query}`;
            } else {
                chainQuery += ` WHERE ${query}`;
            }
            return;
        }

        if (type === 'CONFLICT') {
            chainQuery += ` ${query}`;
            return;
        }
    });
    return chainQuery;
};
