"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const errors_1 = __importDefault(require("./errors"));
const constants_1 = require("./constants");
const pagination_1 = __importDefault(require("./pagination"));
class PostgresQuery {
    constructor(client, config) {
        this.table = config.table;
        this.client = client;
        this.customQueryError = config.queryError;
    }
    /**
     * Run a SELECT query that returns a single record
     */
    findOne(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryString = (0, utils_1.pgFormat)(params.query, params.params);
            const q = (0, utils_1.chainQueryParts)([
                queryString,
                { type: 'WHERE', query: params.filter }
            ]);
            return this.execute(q, 'ONE', 'SELECT');
        });
    }
    /**
     * Run a SELECT query that returns multiple record
     */
    findMany(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryString = (0, utils_1.pgFormat)(params.query, params.params);
            const q = (0, utils_1.chainQueryParts)([
                queryString,
                { type: 'WHERE', query: params.filter },
                { type: 'LIMIT', query: pagination_1.default.pageSize(params.pagination) },
                { type: 'OFFSET', query: pagination_1.default.page(params.pagination) }
            ]);
            return this.execute(q, 'MANY', 'SELECT');
        });
    }
    /**
     * Run a UPDATE query that changes a single record
     */
    updateOne(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = 'UPDATE';
            const table = params.table || this.table;
            // todo table empty error
            const updateQueryString = utils_1.pgHelpers.update(params.data, (0, utils_1.buildColumnSet)(params.columns, table), table, {
                emptyUpdate: null
            });
            if (!updateQueryString) {
                this.throwError({
                    code: constants_1.QueryErrorCodes.NoUpdateColumns,
                    message: 'No columns for updating were provided',
                    command,
                    table,
                    query: ''
                });
            }
            const q = (0, utils_1.chainQueryParts)([
                updateQueryString,
                { type: 'WHERE', query: params.filter },
                { type: 'RETURNING', query: params.returning }
            ]);
            return this.execute(q, 'ONE', command, table);
        });
    }
    /**
     * Run a UPDATE query that changes multiple records
     */
    updateMany(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = 'UPDATE';
            const table = params.table || this.table;
            // todo table empty error
            const updateQueryString = utils_1.pgHelpers.update(params.data, (0, utils_1.buildColumnSet)(params.columns, table), table, {
                emptyUpdate: null
            });
            if (!updateQueryString) {
                this.throwError({
                    code: constants_1.QueryErrorCodes.NoUpdateColumns,
                    message: 'No columns for updating were provided',
                    command,
                    table,
                    query: ''
                });
            }
            const q = (0, utils_1.chainQueryParts)([
                updateQueryString,
                { type: 'WHERE', query: params.filter },
                { type: 'RETURNING', query: params.returning }
            ]);
            return this.execute(q, 'MANY', command, table);
        });
    }
    /**
     * Run a CREATE query
     */
    createOne(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = 'CREATE';
            const table = params.table || this.table;
            // todo table empty error
            const createQueryString = utils_1.pgHelpers.insert(params.data, (0, utils_1.buildColumnSet)(params.columns, table), table);
            if (!createQueryString) {
                throw Error('No columns for creating were provided!');
            }
            const q = (0, utils_1.chainQueryParts)([
                createQueryString,
                { type: 'CONFLICT', query: params.conflict },
                { type: 'RETURNING', query: params.returning }
            ]);
            return this.execute(q, 'ONE', command, table);
        });
    }
    /**
     * Run a CREATE query that creates multiple records
     */
    createMany(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = 'CREATE';
            const table = params.table || this.table;
            // todo table empty error
            const createQueryString = utils_1.pgHelpers.insert(params.data, (0, utils_1.buildColumnSet)(params.columns, table), table);
            if (!createQueryString) {
                throw Error('No columns for creating were provided!');
            }
            const q = (0, utils_1.chainQueryParts)([
                createQueryString,
                { type: 'CONFLICT', query: params.conflict },
                { type: 'RETURNING', query: params.returning }
            ]);
            return this.execute(q, 'ANY', command, table);
        });
    }
    /**
     * Executes any query
     */
    run(query, params = {}, mode = 'ONE') {
        return __awaiter(this, void 0, void 0, function* () {
            const queryString = (0, utils_1.pgFormat)(query, params);
            return this.execute(queryString, mode);
        });
    }
    /**
     * Initiate a transaction
     */
    transaction() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.client.tx;
        });
    }
    /**
     * Central method that executes all queries
     */
    execute(query, queryReturnMode, queryCommand = undefined, table = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!query || query.trim() === '') {
                return this.throwError({
                    command: queryCommand,
                    query,
                    table,
                    code: constants_1.QueryErrorCodes.EmptyQuery,
                    message: 'An empty query was provided'
                });
            }
            return this.client
                .any(query)
                .then((res) => {
                // console.log(query, queryReturnMode, res);
                if (Array.isArray(res) && queryReturnMode === 'ONE') {
                    // not results found
                    if (res.length === 0) {
                        return null;
                    }
                    // return single record as object, not array
                    if (res.length === 1) {
                        return res[0];
                    }
                    // Multiple rows error
                    return this.throwError({
                        command: queryCommand,
                        query,
                        table,
                        code: constants_1.QueryErrorCodes.MultipleRowsReturned,
                        message: "Multiple rows were not expected for query return mode 'ONE'"
                    });
                }
                return res;
            })
                .catch((err) => {
                // Constraint error, e.g. unique constraint
                if ('constraint' in err && err.constraint) {
                    return this.throwError({
                        table,
                        command: queryCommand,
                        message: err.message,
                        query: query,
                        cause: err,
                        hint: `constraint ${err.constraint}: ${err.detail}`,
                        code: constants_1.QueryErrorCodes.ConstraintViolation
                    });
                }
                //
                if (err.message.includes('violates not-null constraint')) {
                    return this.throwError({
                        table,
                        command: queryCommand,
                        message: err.message,
                        query: query,
                        cause: err,
                        hint: `not-null constraint in column "${err.column}"`,
                        code: constants_1.QueryErrorCodes.ConstraintViolation
                    });
                }
                // prevent double error from MultipleRowsReturned
                if (err instanceof errors_1.default)
                    throw err;
                // Generic error
                return this.throwError({
                    table,
                    command: queryCommand,
                    hint: err.hint,
                    position: err.position,
                    code: constants_1.QueryErrorCodes.ExecutionError,
                    message: err.message,
                    query: query,
                    cause: err
                });
            });
        });
    }
    /**
     * Throws QueryError directly or customQueryError if method is provided upon setup
     * @param options
     * @returns
     */
    throwError(options) {
        if (this.customQueryError) {
            return this.customQueryError(options);
        }
        throw new errors_1.default(options);
    }
}
exports.default = PostgresQuery;
