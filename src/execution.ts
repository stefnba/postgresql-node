import {
    Database,
    DatabaseOptions,
    TransactionClient,
    QueryExecutionCommands
} from './types';
import { pgHelpers, concatenateQuery, pgFormat } from './utils';
import pagination from './pagination';
import { QueryError } from './error';

const executeQuery = async (
    client: Database | TransactionClient,
    options: DatabaseOptions,
    command: QueryExecutionCommands,
    params: any,
    table?: string
) => {
    let query: string | null = null;

    if (command === 'SELECT') {
        const { query: q, filter, pagination: p } = params;
        query = concatenateQuery([
            q,
            { type: 'WHERE', query: filter },
            { query: pagination.pageSize(p), type: 'LIMIT' },
            { query: pagination.page(p), type: 'OFFSET' }
        ]);
    }
    if (command === 'UPDATE') {
        const {
            data,
            columns,
            table: t_,
            returning,
            filter,
            conflict
        } = params;

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
    if (command === 'INSERT') {
        const { data, columns, returning, table: t_, conflict } = params;

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
    if (command === 'RUN') {
        query = params.query;
    }

    if (!query) {
        throw Error('');
    }

    if (params.params) {
        query = pgFormat(query, params.params);
    }

    return client
        .any(query)
        .then((r) => {
            if (options.query?.onReturn) {
                options.query?.onReturn(r, query as string);
            }
            return r;
        })
        .catch((err) => {
            if (options.query?.onError) {
                options.query?.onError(
                    { message: err.message },
                    query as string
                );
            } else {
                throw new QueryError({
                    command: command,
                    message: err.message,
                    query: query as string,
                    table: table,
                    cause: err
                });
            }
            return err;
        });
};

export default executeQuery;
