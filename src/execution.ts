import {
    Database,
    DatabaseOptions,
    TransactionClient,
    QueryExecutionCommands,
    FindQueryParams,
    AddQueryParams,
    UpdateQueryParams,
    RunQueryParams
} from './types';
import { concatenateQuery, pgFormat, buildUpdateInsertQuery } from './utils';
import pagination from './pagination';
import { QueryBuildError, QueryExecutionError } from './error';

/**
 * Executes query against database
 * @param client
 * @param options
 * @param command
 * @param params
 * @param table
 * @returns
 * Results from database
 */
const executeQuery = async (
    client: Database | TransactionClient,
    options: DatabaseOptions,
    command: QueryExecutionCommands,
    params:
        | string
        | (
              | FindQueryParams
              | AddQueryParams
              | UpdateQueryParams
              | RunQueryParams
          ),
    table?: string
) => {
    let query = '';

    // run can have query as string
    if (command === 'RUN') {
        if (typeof params === 'string') {
            query = params;
        }
    }

    if (command === 'SELECT' && typeof params !== 'string') {
        const { query: q, filter, pagination: p } = params as FindQueryParams;
        query = concatenateQuery([
            q,
            { type: 'WHERE', query: filter },
            { query: pagination.pageSize(p), type: 'LIMIT' },
            { query: pagination.page(p), type: 'OFFSET' }
        ]);
    }
    if (command === 'UPDATE' && typeof params !== 'string') {
        const {
            data,
            columns,
            table: t_,
            returning,
            filter,
            conflict
        } = params as UpdateQueryParams;

        const update = buildUpdateInsertQuery(
            'UPDATE',
            data,
            columns,
            t_ || table
        );

        query = concatenateQuery([
            update,
            { type: 'WHERE', query: filter },
            { type: 'RETURNING', query: returning },
            { type: 'CONFLICT', query: conflict }
        ]);
    }
    if (command === 'INSERT' && typeof params !== 'string') {
        const {
            data,
            columns,
            returning,
            table: t_,
            conflict
        } = params as AddQueryParams;

        const insert = buildUpdateInsertQuery(
            'INSERT',
            data,
            columns,
            t_ || table
        );
        query = concatenateQuery([
            insert,
            { type: 'RETURNING', query: returning },
            { type: 'CONFLICT', query: conflict }
        ]);
    }

    if (!query || query.trim() === '') {
        throw new QueryBuildError({
            message: 'Query cannot be empty',
            type: 'EMPTY_QUERY',
            query,
            command
        });
    }

    if (typeof params !== 'string' && params.params) {
        query = pgFormat(query.trim(), params.params);
    }

    return client
        .any(query)
        .then((r) => {
            if (options.query?.onReturn) {
                options.query?.onReturn(r, query);
            }
            return r;
        })
        .catch((err) => {
            if (options.query?.onError) {
                options.query?.onError({ message: err.message }, query);
            } else {
                throw new QueryExecutionError({
                    command: command,
                    message: err.message,
                    query,
                    table,
                    cause: err
                });
            }
            return err;
        });
};

export default executeQuery;
