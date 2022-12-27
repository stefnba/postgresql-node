"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildColumnSet = exports.chainQueryParts = exports.QueryIncludesClause = exports.queryToString = exports.pgFormat = exports.pgHelpers = void 0;
const pg_promise_1 = __importStar(require("pg-promise"));
exports.pgHelpers = (0, pg_promise_1.default)().helpers;
/**
 * Format, espaces and integrates parameters into query
 */
exports.pgFormat = (0, pg_promise_1.default)().as.format;
/**
 * Convers QueryInput (e.g. QueryFile) to string
 * @param qf input query, can either be string or QueryFile
 * @returns Query as string
 */
const queryToString = (qf) => {
    if (qf instanceof pg_promise_1.QueryFile) {
        return (0, exports.pgFormat)(qf);
    }
    return qf;
};
exports.queryToString = queryToString;
/**
 * Check if query already contains clause; relevant for chaining to work
 * @param q Query
 * @param clause Relevant clause, e.g. WHERE, RETURNING, CONFLICHT
 * @returns true or false
 */
const QueryIncludesClause = (q, clause) => {
    const query = (0, exports.queryToString)(q);
    if (query.toLowerCase().includes(clause.toLowerCase()))
        return true;
    return false;
};
exports.QueryIncludesClause = QueryIncludesClause;
/**
 * Concatenates different parts of query into a single query statement
 * @param queryParts either string (QueryFile not possible) or object
 */
const chainQueryParts = (queryParts) => {
    let chainQuery = '';
    queryParts.forEach((queryPart) => {
        // normal string, QueryFile no longer possible here
        if (typeof queryPart === 'string') {
            chainQuery += ` ${queryPart}`;
            return;
        }
        const { query, type } = queryPart;
        if (query === undefined)
            return;
        if (type === 'RETURNING') {
            if ((0, exports.QueryIncludesClause)(chainQuery, type)) {
                chainQuery += ` ${query}`;
            }
            else {
                chainQuery += ` RETURNING ${query}`;
            }
            return;
        }
        if (type === 'WHERE') {
            if ((0, exports.QueryIncludesClause)(chainQuery, type)) {
                chainQuery += ` AND ${query}`;
            }
            else {
                chainQuery += ` WHERE ${query}`;
            }
            return;
        }
        if (type === 'CONFLICT') {
            chainQuery += `ON CONFLICT ${query}`;
            return;
        }
        if (type === 'LIMIT') {
            chainQuery += ` ${query}`;
            return;
        }
        if (type === 'OFFSET') {
            chainQuery += ` ${query}`;
            return;
        }
    });
    return chainQuery;
};
exports.chainQueryParts = chainQueryParts;
const buildColumnSet = (columns, table = undefined) => {
    return new exports.pgHelpers.ColumnSet(columns.map((col) => {
        if (typeof col === 'string') {
            // make optional if ? is provided in column name
            if (col.endsWith('?')) {
                return {
                    name: col.replace('?', ''),
                    skip: (a) => !a.exists
                };
            }
            return col;
        }
        if (typeof col === 'object' && 'optional' in col) {
            const _a = col, { optional } = _a, rest = __rest(_a, ["optional"]);
            if (optional) {
                return Object.assign(Object.assign({}, rest), { skip: (a) => !a.exists });
            }
            return rest;
        }
        return col;
    }), {
        table: table
    });
};
exports.buildColumnSet = buildColumnSet;
