import path from 'path';
import { QueryFile } from 'pg-promise';
import PostgresClient from './client';

import { filterOperators } from './filter';

import type {
    ColumnSets,
    ColumnSetsParams,
    QuerySetsParams,
    QuerySets,
    FilterSetsParams
} from './types';
import { pgHelpers } from './utils';

export default class QuerySuite<M> {
    table: string;

    constructor(table: string) {
        this.table = table;
    }

    /**
     * Returns filter function that
     */
    filterSets<T extends FilterSetsParams<M>>(filterSets: T) {
        return (filters: Record<string, unknown>) => {
            const appliedFilters = Object.entries(filters).map(
                ([filterKey, filterValue]) => {
                    // filterKey is allowed to be used
                    if (filterKey in filterSets) {
                        // filters with value undefined are ignored
                        if (filterValue === undefined) {
                            return;
                        }

                        const filterConfig = filterSets[filterKey];
                        if (filterConfig) {
                            return {
                                filter: filterKey,
                                value: filterValue,
                                operator: filterConfig.operator,
                                sql: filterOperators[filterConfig.operator]({
                                    alias: filterConfig.alias || this.table,
                                    column: filterConfig.column,
                                    value: filterValue
                                })
                            };
                        }
                    }
                    return;
                }
            );

            if (appliedFilters.length === 0) return '';
            return appliedFilters
                .filter((f) => f !== undefined)
                .map((f) => f?.sql)
                .join(' AND ');
        };
    }

    /**
     * Creates a new ColumnSet object to limit columns that can be used in update and create queries
     */
    columnSets<T extends ColumnSetsParams<M>>(columnSets: T) {
        return columnSets;
    }

    /**
     * Creates a new querySet object that return QueryFiles that can be used to run queries
     */
    querySets<T extends QuerySetsParams>(
        querySets: T,
        baseDir: string | Array<string> = process.cwd()
    ): QuerySets<T> {
        const fullDirPath = Array.isArray(baseDir)
            ? path.join(...baseDir)
            : baseDir;

        return Object.entries(querySets).reduce(
            (acc, [queryKey, queryFileLocation]) => {
                const fullPath = path.join(fullDirPath, queryFileLocation);
                const qf = new QueryFile(fullPath);
                return {
                    ...acc,
                    [queryKey]: qf
                };
            },
            {} as QuerySets<T>
        );
    }
}
