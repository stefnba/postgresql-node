import { QueryErrorTypes } from './constants';
import type {
    QueryErrorArgs,
    QueryExecutionCommands,
    ConnectionErrorArgs,
    DatabaseConnectionParams,
    PostgresErrorObject,
    ConnectionErrorPublic
} from './types';

/**
 * Query Error that extends Error with additional properties
 */
export class QueryError extends Error {
    type?: QueryErrorTypes;
    command?: QueryExecutionCommands;
    query?: string;
    table?: string;
    schema?: string;
    column?: string;
    hint?: string;
    cause?: Error;
    position?: number;
    code?: string;

    constructor({
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
        this.command = command;
        this.table = table;
        this.query = query;
        this.hint = hint;
        this.position = position;
        this.cause = cause;

        if (cause?.code) {
            const { code } = cause;
            this.code = code;

            if (code === '23502') this.notNullConstraint();
            // syntax error
        }

        Object.setPrototypeOf(this, new.target.prototype);
        // Error.captureStackTrace(this, this.constructor);
    }

    includeTypeInMessage() {
        this.message = `[${this.type}] ${this.message}`;
    }

    /**
     * Violates not-null constraint of column
     */
    notNullConstraint() {
        this.code = '23502';
        this.type = QueryErrorTypes.NotNullViolation;
        this.includeTypeInMessage();

        const cause = this.cause as Error & { schema: string; column: string };
        this.schema = cause.schema;
        this.column = cause.column;
    }
}

/**
 * Error related to failed connections
 */
export class ConnectionError extends Error {
    connection: DatabaseConnectionParams;
    private cause: PostgresErrorObject;
    code: string;
    type!:
        | 'AuthFailed'
        | 'DatabaseNotFound'
        | 'HostNotFound'
        | 'PortNotResponding'
        | 'RoleNotFound';

    constructor({ connection, message, cause }: ConnectionErrorArgs) {
        super(message);
        this.connection = connection;
        this.cause = cause;

        this.code = cause.code;
        if (cause.code) {
            if (cause.code === 'ENOTFOUND') this.hostNotFound();
            if (cause.code === 'ECONNREFUSED') this.PortNotResponding();
            if (cause.code === '3D000') this.dbNotFound();
            if (cause.code === '28P01') this.authFailed();
            if (cause.code === '28000') this.roleNotFound();
        }
    }

    public(): ConnectionErrorPublic {
        return {
            type: this.type,
            code: this.code,
            message: this.message
        };
    }
    private hostNotFound() {
        this.type = 'HostNotFound';
        this.message = `Connection to the host "${this.connection.host}" could not be established`;
    }
    private PortNotResponding() {
        this.type = 'PortNotResponding';
        this.message = `Connection to port "${this.connection.port}" on host "${this.connection.host}" refused`;
    }
    private authFailed() {
        this.type = 'AuthFailed';
        this.message = `Authentication for user "${this.connection.user}" failed`;
    }
    private dbNotFound() {
        this.type = 'DatabaseNotFound';
        this.message = `Database "${this.connection.database}" not found`;
    }
    private roleNotFound() {
        this.type = 'RoleNotFound';
        this.message = `Role "${this.connection.user}" not found`;
    }
}
