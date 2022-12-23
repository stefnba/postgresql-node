import dotenv from 'dotenv';

import PostgresClient, { QuerySuite } from '../src';

dotenv.config();

const connection = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 30
};

type UserModel = {
    id: number;
    name: string;
    email: string;
};

const db = new PostgresClient(connection);

const userQuerySuite = new QuerySuite<UserModel>('users');

const cs = userQuerySuite.columnSets({
    update: ['email'],
    create: ['name', 'id']
});

const queries = userQuerySuite.querySets(
    {
        test: 'test.sql'
    },
    [__dirname, 'db/queryFiles']
);

const filters = userQuerySuite.filterSets({
    id: { column: 'id', operator: 'EQUAL' },
    email: { column: 'name', operator: 'INCLUDES', alias: 'users' }
});

// console.log(queries);
// console.log(cs);
// console.log(filters({ id: 'dd', asd: 1111, email: [1, 2] }));

// const q = userQuerySuite.db()

const run = async () => {
    const queryPortfolio = {
        list: () =>
            db.query.findMany<UserModel>({
                query: queries.test,
                filter: filters({ id: 9569721 })
            })
        // create: ({ data }) =>
        //     db.query.create<UserModel>({ data, columns: cs.create })
    };

    const r = await queryPortfolio.list();

    console.log(r.map((r) => r.email));
};

run();
