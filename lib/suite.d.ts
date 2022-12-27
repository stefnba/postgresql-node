import type { ColumnSetsParams, QuerySetsParams, QuerySets, FilterSetsParams } from './types';
export default class QuerySuite<M> {
    table: string;
    constructor(table: string);
    /**
     * Returns filter function that
     */
    filterSets<T extends FilterSetsParams<M>>(filterSets: T): (filters: Record<string, unknown>) => string;
    /**
     * Creates a new ColumnSet object to limit columns that can be used in update and create queries
     */
    columnSets<T extends ColumnSetsParams<M>>(columnSets: T): T;
    /**
     * Creates a new querySet object that return QueryFiles that can be used to run queries
     */
    querySets<T extends QuerySetsParams>(querySets: T, baseDir?: string | Array<string>): QuerySets<T>;
}
