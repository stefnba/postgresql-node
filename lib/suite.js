"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const pg_promise_1 = require("pg-promise");
const filter_1 = require("./filter");
class QuerySuite {
    constructor(table) {
        this.table = table;
    }
    /**
     * Returns filter function that
     */
    filterSets(filterSets) {
        return (filters) => {
            const appliedFilters = Object.entries(filters).map(([filterKey, filterValue]) => {
                // filterKey is allowed to be used
                if (filterKey in filterSets) {
                    // filters with value undefined are ignored
                    if (filterValue === undefined) {
                        return;
                    }
                    const filterConfig = filterSets[filterKey];
                    if (filterConfig) {
                        let sql;
                        // shorthand version, i.e. filterKey is key ob object, operator is value
                        if (typeof filterConfig === 'string') {
                            sql = filter_1.filterOperators[filterConfig]({
                                alias: this.table,
                                column: filterKey,
                                value: filterValue
                            });
                        }
                        else {
                            sql = filter_1.filterOperators[filterConfig.operator]({
                                alias: filterConfig.alias || this.table,
                                column: filterConfig.column,
                                value: filterValue
                            });
                        }
                        return {
                            filter: filterKey,
                            value: filterValue,
                            operator: typeof filterConfig === 'string'
                                ? filterConfig
                                : filterConfig.operator,
                            sql
                        };
                    }
                }
                return;
            });
            if (appliedFilters.length === 0)
                return '';
            return appliedFilters
                .filter((f) => f !== undefined)
                .map((f) => f === null || f === void 0 ? void 0 : f.sql)
                .join(' AND ');
        };
    }
    /**
     * Creates a new ColumnSet object to limit columns that can be used in update and create queries
     */
    columnSets(columnSets) {
        return columnSets;
    }
    /**
     * Creates a new querySet object that return QueryFiles that can be used to run queries
     */
    querySets(querySets, baseDir = process.cwd()) {
        const fullDirPath = Array.isArray(baseDir)
            ? path_1.default.join(...baseDir)
            : baseDir;
        return Object.entries(querySets).reduce((acc, [queryKey, queryFileLocation]) => {
            const fullPath = path_1.default.join(fullDirPath, queryFileLocation);
            const qf = new pg_promise_1.QueryFile(fullPath);
            return Object.assign(Object.assign({}, acc), { [queryKey]: qf });
        }, {});
    }
}
exports.default = QuerySuite;
