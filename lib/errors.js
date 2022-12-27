"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Query Error that extends Error with additional properties
 */
class QueryError extends Error {
    constructor({ code, command, message, query, table, cause, hint, position }) {
        super(message);
        this.message = message;
        this.code = code;
        this.command = command;
        this.table = table;
        this.query = query;
        this.cause = cause;
        this.hint = hint;
        this.position = position;
        this.name = 'QueryError';
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.default = QueryError;
