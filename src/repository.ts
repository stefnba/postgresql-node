import { IDatabase, QueryFile } from 'pg-promise';
import path from 'path';
import PostgresQuery from './query';
import { Database, QueryInit } from './types';

const joinPath = path.join;

export default class DatabaseRepository<M = undefined> {
    // protected readonly db: Database;
    protected query: QueryInit;
    /**
     * Name of table in database
     * */
    protected table?: string;
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

    constructor(db: Database, query: QueryInit) {
        this.table = undefined;
        // this.db = db;

        this.query = query;
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
