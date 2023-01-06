import { QueryFile } from 'pg-promise';
import path from 'path';

import { filterOperators } from './filter';
import type { FilterSet } from './types';
import PostgresQuery from './query';

const joinPath = path.join;

export default class DatabaseRepository<M> {
    /**
     * Query client that can be used in methods to run queries against database connection
     */
    query!: PostgresQuery;
    /**
     * Name of table in database
     * */
    table!: string;
    /**
     * Path to folder that contains .sql files for queries
     * If not specified, root directory is base path
     */
    protected sqlDir?: string;
    /**
     * Define queries that can be used throughout the Repository, either through this.readQueryFile() or directly as a query
     */
    protected queries?: Record<string, string | QueryFile>;
    protected columns?: Record<string, Array<string | keyof M>>;

    protected conf = {
        columns: this.defineColumns,
        sql: {
            file: this.readSql,
            directory: this.setSqlDir
        },
        filter: this.defineFilters
    };

    /**
     * Sets base for for .sql query files that are used in this Repo
     * @param path string | string[]
     */
    private setSqlDir(path: string | Array<string>) {
        const dir = Array.isArray(path) ? joinPath(...path) : path;
        this.sqlDir = dir;
        return dir;
    }

    private defineFilters(filterSet: FilterSet<M>) {
        return filterSet;
    }

    /**
     *
     * @param columns
     * @returns
     */
    private defineColumns(columns: Array<keyof M>) {
        return columns;
    }

    /**
     * Translates filter objected into WHERE query part with only allowed columns as provided as filterSet
     * @param filters
     * @param filterSet
     * Set of allowed filters and each operator (e.g. EQUAL, INCLUDES)
     * @returns string
     * Query as string with conditions concetenated with AND based on provided filter object and allowed filters by FilterSet.
     * WHERE clause never included
     */
    protected filter(filters: object, filterSet: FilterSet<M>): string {
        const appliedFilters = Object.entries(filters).map(
            ([filterKey, filterValue]) => {
                if (filterKey in filterSet) {
                    // filters with value undefined are ignored
                    if (filterValue === undefined) {
                        return;
                    }

                    const filterConfig = filterSet[filterKey];
                    if (filterConfig) {
                        let sql: string;

                        // shorthand version, i.e. filterKey is key ob object, operator is value
                        if (typeof filterConfig === 'string') {
                            sql = filterOperators[filterConfig]({
                                alias: this.table,
                                column: filterKey,
                                value: filterValue
                            });
                        } else {
                            sql = filterOperators[filterConfig.operator]({
                                alias: filterConfig.alias || this.table,
                                column: filterConfig.column,
                                value: filterValue
                            });
                        }

                        return {
                            filter: filterKey,
                            value: filterValue,
                            operator:
                                typeof filterConfig === 'string'
                                    ? filterConfig
                                    : filterConfig.operator,
                            sql
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
    }

    /**
     * Reads a prepared SQL QueryFile
     * @param path string
     * Location to .sql file
     * @returns
     * QueryFile Object
     */
    protected readSql(path: string): QueryFile {
        const qf = new QueryFile(joinPath(this.sqlDir || process.cwd(), path), {
            minify: true,
            debug: true // todo env conditon
        });

        if (qf.error) {
            // todo
            console.error(qf.error);
        }

        return qf;
    }
}
