import chai from 'chai';
import mocha from 'mocha';
import dotenv from 'dotenv';

import PostgresClient from '../src';

const { it, describe } = mocha;
const { expect } = chai;
dotenv.config();

const userId = Math.random() * 10000000;

const connection = {
    // user: 'admin',
    // host: 'localhost',
    // database: 'app_db',
    // password: 'password',
    // port: 5413
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 30
};

let db: PostgresClient;

describe('SETUP', () => {
    describe('HOME', () => {
        it('SHOULD connect to database', async () => {
            db = new PostgresClient(connection, {
                error: {
                    query: (err) => {
                        console.log('globalError', err);
                    },
                    connect: (err, connect) => {
                        console.log('globalError', err);
                        console.log('globalError', connect);
                    }
                },
                testConnection: false
            });

            expect(await db.testConnection()).to.be.true;
        });
        it('SHOULD run test query', async () => {
            const r = await db.query.run<{ now: Date }>('SELECT NOW()');
            expect(r).to.have.property('now');
        });
        it('SHOULD return connection details', async () => {
            const connection = db.connectionConfig;
            expect(connection).to.have.property('host');
            expect(connection).to.have.property('port');
            expect(connection).to.have.property('database');
            expect(connection).to.have.property('user');
            expect(connection).to.have.property('password');
        });
    });
});

describe('RUN', () => {
    it('SHOULD CREATE a table', async () => {
        const a = await db.query.run<{ now: Date }>(
            'CREATE TABLE IF NOT EXISTS users (id int, name varchar, email varchar)',
            {},
            'ANY'
        );
        console.log('r', a);
    });
});

describe('CREATE', () => {
    it('SHOULD CREATE a test user', async () => {
        const r = await db.query.create<{ now: Date }>({
            data: { id: userId, name: 'testUser', email: 'test@mail.com' },
            table: 'users',
            returning: '*'
        });
        console.log(r);
    });
});

describe('FIND MANY', () => {
    it('SHOULD run test query', async () => {
        const r = await db.query.findMany<{ now: Date }>({
            query: 'SELECT * FROM users'
        });
        console.log(r);
    });
});

describe('FIND ONE', () => {
    it('SHOULD return one user record', async () => {
        const r = await db.query.findOne<{ now: Date }>({
            query: `SELECT * FROM users WHERE id = ${userId}`
        });
        console.log(r);
    });
});
