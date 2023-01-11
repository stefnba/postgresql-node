import { QueryFile } from 'pg-promise';
import path from 'path';

import { filterOperators } from './filter';
import type { ColumnSetParams, FilterSet } from './types';
import PostgresQuery from './query';

const joinPath = path.join;

/**
 * A DatabaseRepository organizes and simplifies interactions with one table in the database.
 * All queries for this table can be added as methods and used throughout the application without
 * the need to re-specify relevant parameters, such as columns, filters, types, etc.
 *
 * All repositories must be registered with the database client through the client.addRepositories() method.
 *
 * @method asdf()
 * adf()
 * @property conf
 * asdf
 *
 * @example
 * const client = new PostgresClient(connection);
 * const repos = client.addRepositories({
 *      user: UserRepo
 * })
 *
 * class UserRepo extends DatabaseRepository {
 *      // specify table name for this repository
 *      table = 'users';
 * }
 */
export default class DatabaseRepository<M> {
    /**
     * Query client that can be used in methods to run queries against database connection
     */
    query!: PostgresQuery;
    /**
     * Name of table in database. If specified, UPDATE and ADD queries don't require the param "table".
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
    // protected columns?: Record<string, Array<string | keyof M>>;

    /**
     * Configuration property that combined various methods to set up a DatabaseRepository
     */
    protected conf = {
        columnSet: this.defineColumnSet,
        filterSet: this.defineFilterSet,
        sqlFile: this.readSql,
        sqlDir: this.setSqlDir
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

    /**
     * Creates new filterSet that defines the filters that are allowed for a SELECT or UPDATE query
     * @param filterSet object
     *
     * @returns
     * Configured filterSet
     */
    private defineFilterSet(filterSet: FilterSet<M>) {
        return filterSet;
    }

    /**
     * Creates new columnSet that defines the columns that are allowed and/or required for a UPDATE or INSERT query
     * @param columns
     * @returns
     * Configured columnSet
     */
    private defineColumnSet(columns: ColumnSetParams<M>): ColumnSetParams {
        return columns as ColumnSetParams;
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
    protected applyFilter(filters: object, filterSet: FilterSet<M>): string {
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
     * Reads a prepared SQL QueryFile.
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
