import { applyFilter } from './filter';
import type { ColumnSetParams, FilterSet } from './types';
import QueryBuilder from './builder';
import { sqlFile } from './queryFile';

/**
 * A DatabaseRepository organizes and simplifies interactions with one table in the database.
 * All queries for this table can be added as methods and used throughout the application without
 * the need to re-specify relevant parameters, such as columns, filters, types, etc.
 *
 * All repositories must be registered with the database client through the client.addRepositories() method.
 *
 * @method filterSet
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
    query!: QueryBuilder;
    /**
     * Name of table in database. If specified, UPDATE and ADD queries don't require the param "table".
     * */
    table!: string;
    /**
     * Path to base directory that contains .sql files for queries
     * If not specified, root directory is base path
     */
    protected sqlFilesDir?: string | string[];

    /**
     * Creates new filterSet that defines the filters that are allowed for a SELECT or UPDATE query
     * @param filterSet object
     *
     * @returns
     * Configured filterSet
     */
    protected filterSet(filterSet: FilterSet<M>) {
        return filterSet;
    }

    /**
     * Creates new columnSet that defines the columns that are allowed and/or required for a UPDATE or INSERT query
     * @param columns
     * @returns
     * Configured columnSet
     */
    protected columnSet(columns: ColumnSetParams<M>) {
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
        return applyFilter(filters, filterSet as FilterSet, this.table);
    }

    /**
     * Reads a prepared SQL QueryFile.
     * @param path string
     * Location to .sql file
     * @returns
     * QueryFile Object
     */
    protected sqlFile(path: string | string[], directory?: string | string[]) {
        return sqlFile(path, directory || this.sqlFilesDir);
    }
}
