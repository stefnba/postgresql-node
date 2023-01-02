import { QueryErrorTypes } from './constants';
import type {
    QueryErrorArgs,
    QueryCommands,
    ConnectionErrorArgs,
    DatabaseConnection
} from './types';

/**
 * Query Error that extends Error with additional properties
 */
export class QueryError extends Error {
    type: QueryErrorTypes;
    command?: QueryCommands;
    query?: string;
    table?: string;
    hint?: string;
    cause?: Error;
    position?: number;
    code?: string;

    constructor({
        type,
        command,
        message,
        query,
        table,
        cause,
        hint,
        position
    }: QueryErrorArgs) {
        super(message);
        this.name = 'QueryError';

        this.message = message;
        this.type = type;
        this.command = command;
        this.table = table;
        this.query = query;
        this.cause = cause;
        this.hint = hint;
        this.position = position;

        if (cause?.code) {
            this.code = cause.code;
        }

        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error related to failed connections
 */
export class ConnectionError extends Error {
    connection: DatabaseConnection;

    constructor({ connection, message }: ConnectionErrorArgs) {
        super(message);
        this.connection = connection;
    }
}
