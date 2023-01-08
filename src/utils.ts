import pgPromise, { QueryFile } from 'pg-promise';

import type {
    QueryInput,
    QueryConcatenationParams,
    QueryInserUpdateCommands,
    ColumnSetParams
} from './types';
import { QueryBuildError } from './error';

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

/**
 * Checks if query includes certain clauses, e.g. WHERE, RETURNING, to avoid errors
 * @param query string
 * String that will be checked if clause exists
 * @param clause string
 *
 * @returns
 */
export function queryIncludesClause(query: string, clause: string) {
    if (query.toLowerCase().includes(clause.toLowerCase())) return true;
    return false;
}

/**
 * Concatenate different parts of query and determined if certain clauses, operators need to be inserted
 * @param parts Array of string|QueryFile|object
 * - string
 * - QueryFile
 * - object with keys: type, query
 * @returns string
 * Final query with all parts concatenated
 */
export function concatenateQuery(parts: QueryConcatenationParams): string {
    let fullQuery = '';

    parts.forEach((part) => {
        // normal string, QueryFile no longer possible here
        if (typeof part === 'string') {
            fullQuery += ` ${part}`;
            return;
        }
        // QueryFile
        if (part instanceof QueryFile) {
            fullQuery += ` ${pgFormat(part)}`;
            return;
        }

        // object
        const { query: q, type } = part;

        // return if undefined
        if (q === undefined) return;
        const query = pgFormat(q);

        if (type === 'RETURNING') {
            const clause = 'RETURNING';
            if (
                queryIncludesClause(fullQuery, clause) ||
                queryIncludesClause(query, clause)
            ) {
                fullQuery += ` ${query}`;
                return;
            }
            fullQuery += ` ${clause} ${query}`;
            return;
        }
        if (type === 'WHERE') {
            const clause = 'WHERE';
            if (
                queryIncludesClause(fullQuery, clause) ||
                queryIncludesClause(query, clause)
            ) {
                fullQuery += ` AND ${query}`;
                return;
            }
            fullQuery += ` ${clause} ${query}`;
            return;
        }
        if (type === 'CONFLICT') {
            const clause = 'CONFLICT ON';
            if (
                queryIncludesClause(fullQuery, clause) ||
                queryIncludesClause(query, clause)
            ) {
                fullQuery += ` ${query}`;
                return;
            }
            fullQuery += ` ${clause} ${query}`;
            return;
        }
        if (type === 'LIMIT') {
            const clause = 'LIMIT';
            if (
                queryIncludesClause(fullQuery, clause) ||
                queryIncludesClause(query, clause)
            ) {
                fullQuery += ` ${query}`;
                return;
            }
            fullQuery += ` ${clause} ${query}`;
            return;
        }
        if (type === 'OFFSET') {
            const clause = 'OFFSET';
            if (
                queryIncludesClause(fullQuery, clause) ||
                queryIncludesClause(query, clause)
            ) {
                fullQuery += ` ${query}`;
                return;
            }
            fullQuery += ` ${clause} ${query}`;
            return;
        }
        if (type === 'ORDER') {
            const clause = 'ORDER BY';
            if (
                queryIncludesClause(fullQuery, clause) ||
                queryIncludesClause(query, clause)
            ) {
                fullQuery += ` ${query}`;
                return;
            }
            fullQuery += ` ${clause} ${query}`;
            return;
        }
    });
    return fullQuery;
}

/**
 *
 * @param command
 * @param data
 * @param columns
 * @param table
 * @returns
 */
export const buildUpdateInsertQuery = (
    command: QueryInserUpdateCommands,
    data: object,
    columns?: ColumnSetParams,
    table?: string
) => {
    if (!table) {
        throw new QueryBuildError({
            message: 'A table name is required for UPDATE command',
            type: 'TableMissing',
            command
        });
    }

    const _command = command === 'INSERT' ? 'insert' : 'update';

    try {
        return pgHelpers[_command](data, columns, table);
    } catch (err) {
        console.log(err);
        throw new QueryBuildError({
            message: 'A table name is required for UPDATE command',
            type: 'TableMissing',
            command
        });
    }
};

const { ColumnSet: PgColumnSet } = pgHelpers;

export class ColumnSet<M = undefined> extends PgColumnSet<M> {
    constructor(columns: ColumnSetParams<M>, table?: string) {
        const _columns = columns.map((col) => {
            if (typeof col === 'string') {
                // make optional if ? is provided in column name
                if (col.endsWith('?')) {
                    return {
                        name: col.replace('?', ''),
                        skip: (a: any) => !a.exists
                    };
                }
                return col;
            }
            if (typeof col === 'object' && 'optional' in col) {
                const { optional, ...rest } = col as { optional: boolean };
                if (optional) {
                    return {
                        ...rest,
                        skip: (a: any) => !a.exists
                    };
                }
                return rest;
            }
            return col;
        });

        super(_columns, { table });
    }
}
