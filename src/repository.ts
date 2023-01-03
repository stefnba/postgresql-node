import { QueryFile } from 'pg-promise';
import path from 'path';
import { QueryInit } from './types';

const joinPath = path.join;

export default abstract class DatabaseRepository<M = void> {
    // protected readonly db: Database;
    query!: QueryInit;
    /**
     * Name of table in database
     * */
    table?: string;
    /** Test */
    protected filters?: Record<string, number>;
    /**
     * Path to folder that contains .sql files for queries
     * If not specified, root directory is base path
     */
    protected queryFileBaseDir?: string | Array<string>;
    /**
     * Define queries that can be used throughout the Repository, either through this.readQueryFile() or directly as a query
     */
    protected queries?: Record<string, string | QueryFile>;

    columns?: Record<string, Array<M extends void ? string : keyof M>>;

    /**
     *
     * @param columns
     * @returns
     */
    protected defineColumns(columns: Array<M extends void ? string : keyof M>) {
        return columns;
    }

    /**
     * Reads a prepared SQL QueryFile
     * @param path string
     * Location to .sql file
     * @returns
     * QueryFile Object
     */
    protected readSql(path: string): QueryFile {
        const fullDirPath = Array.isArray(this.queryFileBaseDir)
            ? joinPath(...this.queryFileBaseDir)
            : this.queryFileBaseDir;

        const qf = new QueryFile(joinPath(fullDirPath || process.cwd(), path), {
            minify: true
        });

        if (qf.error) {
            console.error(qf.error);
        }

        return qf;
    }
}
