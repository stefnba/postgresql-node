import type {
    QueryErrorArgs,
    QueryExecutionErrorArgs,
    ConnectionErrorArgs,
    DatabaseConnectionParams,
    PostgresErrorObject,
    ConnectionErrorPublic,
    QueryBuildErrorParams,
    QueryResultErrorParams,
    QueryExecutionCommands
} from './types';

/**
 * Query Error that extends Error with additional properties
 */
export class QueryError extends Error {
    table?: string;
    query?: string;
    command?: QueryExecutionCommands;

    constructor(params: QueryErrorArgs) {
        const { message, table, query, command } = params;
        super(message);

        this.message = message;
        this.table = table;
        this.query = query;
        this.command = command;

        // Object.setPrototypeOf(this, new.target.prototype);
        // Error.captureStackTrace(this, this.constructor);
    }
}

export class QueryResultError extends QueryError {
    type?: QueryResultErrorParams['type'];

    constructor(params: QueryResultErrorParams) {
        const { message, type, command } = params;
        super({ message, command });

        this.type = type;
    }
}

export class QueryBuildError extends QueryError {
    type?: QueryBuildErrorParams['type'];

    constructor(params: QueryBuildErrorParams) {
        const { message, type, command, query } = params;
        super({ message, command });

        this.type = type;
        this.query = query;
    }
}

export class QueryExecutionError extends QueryError {
    code: string;
    type?:
        | 'NullConstraintViolation'
        | 'UniqueConstraintViolation'
        | 'MissingColumn';
    column?: string;
    detail?: string;
    schema?: string;
    constraint?: string;

    constructor(params: QueryExecutionErrorArgs) {
        const { message, cause, command, query } = params;
        super({ message, command });

        this.code = cause.code;

        console.log(cause);

        this.column = cause.column;
        this.detail = cause.detail;
        this.schema = cause.schema;
        this.table = cause.table;
        this.constraint = cause.constraint;
        this.query = cause.query || query;

        if (cause.code) {
            if (this.code === '23502') this.notNullConstraint();
            if (this.code === '23505') this.uniqueConstraint();
            if (this.code === '42703') this.missingColumn();
        }
    }

    /**
     * Violates not-null constraint of column
     */
    notNullConstraint() {
        this.type = 'NullConstraintViolation';
    }
    uniqueConstraint() {
        this.type = 'UniqueConstraintViolation';
    }
    missingColumn() {
        this.type = 'MissingColumn';
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
