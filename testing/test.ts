import dotenv from 'dotenv';

import PostgresClient from '../src';

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

// NORMAL QUERY
const q = db.query;

// QUERY SUITE
const userQuerySuite = db.newQuerySuite<UserModel>('users');

const cs = userQuerySuite.config.columnSets({
    update: ['email'],
    create: ['email', 'id', 'name']
});

const queries = userQuerySuite.config.querySets(
    {
        test: 'test.sql'
    },
    [__dirname, 'db/queryFiles']
);

const filters = userQuerySuite.config.filterSets({
    id: { column: 'id', operator: 'EQUAL' },
    email: { column: 'name', operator: 'INCLUDES', alias: 'users' }
});

const run = async () => {
    const queryPortfolio = {
        list: () =>
            userQuerySuite.query.findMany<UserModel>({
                query: queries.test,
                filter: filters({ id: 9569721 })
            }),
        create: (data: Pick<UserModel, 'email' | 'name' | 'id'>) =>
            userQuerySuite.query.createOne<UserModel>({
                data,
                columns: cs.create,
                returning: '*',
                conflict: 'DO NOTHING'
            })
    };

    const c = await queryPortfolio.create({
        id: 12321321,
        name: 'testMan',
        email: 'tests@klajsdfklasdflk.com'
    });
    const l = await queryPortfolio.list();

    console.log(l);
    console.log(c);

    const a = db.query.createOne({
        data: {
            id: 12321321,
            name: 'testMan',
            email: 'tests@klajsdfklasdflk.com'
        },
        columns: ['id', 'name', 'email']
    });
};

run();
