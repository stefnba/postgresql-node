import { QueryErrorCodes } from './constants';
import type { QueryErrorArgs, QueryCommands } from './types';

/**
 * Query Error that extends Error with additional properties
 */
export default class QueryError extends Error {
    code: QueryErrorCodes;
    command: QueryCommands | undefined;
    query: string | undefined;
    table: string | undefined;
    hint: string | undefined;
    cause: Error | undefined;
    position: number | undefined;

    constructor({
        code,
        command,
        message,
        query,
        table,
        cause,
        hint,
        position
    }: QueryErrorArgs) {
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
