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

const userQuerySuite = db.createQuerySuite<UserModel>('users');

const { columns, queries, table, run } = userQuerySuite({
    columnSets: {
        update: ['email'],
        create: ['id', 'name']
    },
    querySets: {
        path: [__dirname, 'db/queryFiles'],
        queries: {
            update: 'test.sql'
        }
    }
});

console.log(queries);
console.log(table);
console.log(columns);
