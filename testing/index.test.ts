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
                // error: {
                //     query: (err) => {
                //         console.log('globalError', err);
                //     },
                //     connect: (err, connect) => {
                //         console.log('globalError', err);
                //         console.log('globalError', connect);
                //     }
                // },
                testConnection: false
            });

            const status = await db.status(false);
            expect(status).to.have.property('status');
            expect(status.status).to.equal('CONNECTED');
            expect(status).to.have.property('connection');
            expect(status.connection).to.have.property('host');
            expect(status.connection).to.have.property('port');
            expect(status.connection).to.have.property('user');
            expect(status.connection).to.have.property('database');
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
        await db.query.run<{ now: Date }>(
            'CREATE TABLE IF NOT EXISTS users (id int, name varchar, email varchar)',
            {},
            'ANY'
        );
    });
});

describe('CREATE', () => {
    it('SHOULD CREATE a test user', async () => {
        const r = await db.query.create<{ now: Date }>({
            data: { id: userId, name: 'testUser', email: 'test@mail.com' },
            table: 'users',
            returning: '*'
        });
    });
    // it('SHOULD CREATE multiple users', async () => {
    //     const r = await db.query.create<{ now: Date }>({
    //         data: [
    //             { id: userId, name: 'testUser', email: 'test@mail.com' },
    //             { id: userId + 1, name: 'testUser', email: 'test@mail.com' }
    //         ],
    //         table: 'users',
    //         returning: '*'
    //     });
    //     console.log(r);
    // });
});

describe('FIND MANY', () => {
    it('SHOULD LIST many users', async () => {
        const r = await db.query.findMany<{ now: Date }>({
            query: 'SELECT * FROM users'
        });
    });
});

describe('FIND ONE', () => {
    it('SHOULD return one user record', async () => {
        const r = await db.query.findOne<{ now: Date }>({
            query: `SELECT * FROM users WHERE id = ${userId}`
        });
        console.log(r);
    });
    // it('SHOULD fail due to multiple users returned', async () => {
    //     expect(
    //         await db.query.findOne<{ now: Date }>({
    //             query: 'SELECT * FROM users'
    //         })
    //     ).to.throw();
    // });
    it('SHOULD throw query error', async () => {
        const func = async () => {
            try {
                await db.query.findOne({
                    query: 'SELECT *FROM users'
                });
            } catch {
                throw new Error();
            }
        };
        // https://stackoverflow.com/questions/63511399/mocha-assert-asynchronous-function-throws-exception
        console.log(func());
        expect(() => func()).to.throw();
    });
});
