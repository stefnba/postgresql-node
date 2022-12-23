import path from 'path';
import { QueryFile } from 'pg-promise';

import type {
    QuerySuiteConfig,
    QuerySuiteColumns,
    ColumnSetsInput,
    QuerySetsInput
} from './types';
import { pgHelpers } from './utils';

export default class PostgresQuerySuite<M> {
    table: string;
    columns: object;
    queries: object;

    constructor(table: string, config: QuerySuiteConfig<M>) {
        this.table = table;
        this.columns = this.prepareColumnSets(config.columnSets);
        this.queries = this.prepareQuerySets(config.querySets);
    }

    /**
     * Register QuerySets
     */
    private prepareQuerySets(querySets: QuerySetsInput | undefined) {
        if (!querySets) return {};
        const { path: location, queries } = querySets;
        const fullDirPath = Array.isArray(location)
            ? path.join(...location)
            : location;

        return Object.entries(queries).reduce(
            (prev, [file, queryFileLocation]) => {
                const fullPath = path.join(fullDirPath, queryFileLocation);
                const qf = new QueryFile(fullPath);

                // todo check for read error
                return { ...prev, [file]: qf };
            },
            {}
        );
    }

    /**
     * Register ColumnSets
     */
    private prepareColumnSets(columnSets: ColumnSetsInput<M> | undefined) {
        if (!columnSets) return {};

        return Object.entries(columnSets).reduce((prev, [query, cols]) => {
            const columns = cols.map((col) => {
                if (typeof col === 'string') {
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
            return {
                ...prev,
                [query]: new pgHelpers.ColumnSet(columns, {
                    table: this.table
                })
            };
        }, {});
    }
}
