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
import { pgHelpers, concatenateQuery, pgFormat } from './utils';
import pagination from './pagination';
import { QueryError } from './error';

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

        const t = t_ || table;

        if (!t) {
            throw new Error('table');
        }

        const update = pgHelpers.update(data, columns, table);

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

        const t = t_ || table;

        if (!t) {
            throw new Error('table');
        }

        const insert = pgHelpers.insert(data, columns, table);
        query = concatenateQuery([
            insert,
            { type: 'RETURNING', query: returning },
            { type: 'CONFLICT', query: conflict }
        ]);
    }

    if (!query || query.trim() === '') {
        throw Error('');
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
                throw new QueryError({
                    command: command,
                    message: err.message,
                    query,
                    table: table,
                    cause: err
                });
            }
            return err;
        });
};

export default executeQuery;
