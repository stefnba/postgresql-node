import pgPromise, { QueryFile } from 'pg-promise';

import type { QueryInput } from './types';

/**
 * Helpers for query building, e.g. insert, update
 */
export const pgHelpers = pgPromise().helpers;

/**
 * Formats, espaces and integrates parameters into query
 */
export const pgFormat = pgPromise().as.format;

/**
 * Convers QueryInput (e.g. QueryFile) to string
 * @param qf
 * Query, can either be string or QueryFile
 * @returns
 * Query converted to string
 */
export const queryToString = (qf: QueryInput): string => {
    if (qf instanceof QueryFile) {
        return pgFormat(qf);
    }
    return qf;
};
