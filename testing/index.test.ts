import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import mocha from 'mocha';
import dotenv from 'dotenv';
import { QueryFile } from 'pg-promise';
// import cryptoRandomString from 'crypto-random-string';

import PostgresClient from '../src';
import QuerySuite from '../src/suite';
import { QueryErrorCodes } from '../src/constants';
import PostgresQuery from '../src/query';

const { it, describe } = mocha;
const { expect } = chai;

chai.use(chaiAsPromised);
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
    rank: number;
};

let db: PostgresClient;

describe('SETUP', () => {
    describe('SUCCESS', () => {
        it('SHOULD SUCCEED to connect to database', async () => {
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

            const status = await db.status({ logging: false });
            expect(status).to.have.property('status');
            expect(status.status).to.equal('CONNECTED');
            expect(status).to.have.property('connection');
            expect(status.connection).to.have.property('host');
            expect(status.connection).to.have.property('port');
            expect(status.connection).to.have.property('user');
            expect(status.connection).to.have.property('database');
        });
        it('SHOULD RUN test query', async () => {
            const r = await db.query.run<{ now: Date }>('SELECT NOW()');
            expect(r).to.have.property('now');
        });
        it('SHOULD RETURN connection details', async () => {
            const connection = db.connectionConfig;
            expect(connection).to.have.property('host');
            expect(connection).to.have.property('port');
            expect(connection).to.have.property('database');
            expect(connection).to.have.property('user');
            expect(connection).to.have.property('password');
        });
    });
    describe('FAIL', () => {
        it('SHOULD FAIL to connect to database due to wrong password', async () => {
            const db1 = new PostgresClient(
                { ...connection, password: 'wrong' },
                {
                    testConnection: false
                }
            );

            const status = await db1.status({ logging: false });
            expect(status).to.have.property('status');
            expect(status.status).to.equal('FAILED');
            expect(status).to.have.property('message');
            expect(status.message).to.include(
                'password authentication failed for user'
            );
            expect(status).to.have.property('connection');
            expect(status.connection).to.have.property('host');
            expect(status.connection).to.have.property('port');
            expect(status.connection).to.have.property('user');
            expect(status.connection).to.have.property('database');
        });
        it('SHOULD FAIL to connect to database due to wrong user', async () => {
            const db2 = new PostgresClient(
                { ...connection, user: 'wrong' },
                {
                    testConnection: false
                }
            );

            const status = await db2.status({ logging: false });
            expect(status).to.have.property('status');
            expect(status.status).to.equal('FAILED');
            expect(status).to.have.property('message');
            expect(status.message).to.include(
                'password authentication failed for user'
            );
            expect(status).to.have.property('connection');
            expect(status.connection).to.have.property('host');
            expect(status.connection).to.have.property('port');
            expect(status.connection).to.have.property('user');
            expect(status.connection).to.have.property('database');
        });
        it('SHOULD FAIL to connect to database due to wrong host', async () => {
            const db2 = new PostgresClient(
                { ...connection, host: 'wrong' },
                {
                    testConnection: false
                }
            );

            const status = await db2.status({ logging: false });
            expect(status).to.have.property('status');
            expect(status.status).to.equal('FAILED');
            expect(status).to.have.property('message');
            expect(status.message).to.include.oneOf([
                'getaddrinfo ENOTFOUND wrong',
                'getaddrinfo EAI_AGAIN wrong'
            ]);
            expect(status).to.have.property('connection');
            expect(status.connection).to.have.property('host');
            expect(status.connection).to.have.property('port');
            expect(status.connection).to.have.property('user');
            expect(status.connection).to.have.property('database');
        });
        it('SHOULD FAIL to connect to database due to wrong port', async () => {
            const db2 = new PostgresClient(
                { ...connection, port: 3333 },
                {
                    testConnection: false
                }
            );

            const status = await db2.status({ logging: false });
            expect(status).to.have.property('status');
            expect(status.status).to.equal('FAILED');
            expect(status).to.have.property('message');
            expect(status.message).to.include('ECONNREFUSED');
            expect(status).to.have.property('connection');
            expect(status.connection).to.have.property('host');
            expect(status.connection).to.have.property('port');
            expect(status.connection).to.have.property('user');
            expect(status.connection).to.have.property('database');
        });
        it('SHOULD FAIL to connect to database due to wrong port', async () => {
            const db2 = new PostgresClient(
                { ...connection, database: 'wrong' },
                {
                    testConnection: false
                }
            );

            const status = await db2.status({ logging: false });
            expect(status).to.have.property('status');
            expect(status.status).to.equal('FAILED');
            expect(status).to.have.property('message');
            expect(status.message).to.include('database');
            expect(status.message).to.include('does not exist');
            expect(status).to.have.property('connection');
            expect(status.connection).to.have.property('host');
            expect(status.connection).to.have.property('port');
            expect(status.connection).to.have.property('user');
            expect(status.connection).to.have.property('database');
        });
    });
});

describe('RUN', () => {
    it('SHOULD CREATE a table', async () => {
        await db.query.run('DROP TABLE IF EXISTS users');
        await db.query.run(
            `
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name varchar NOT NULL,
                    email varchar UNIQUE NOT NULL,
                    rank INT NOT NULL
                )`,
            {},
            'ANY'
        );
    });
    it('SHOULD THROW ERROR due to empty query', async () => {
        const query = db.query.run('', {}, 'ANY');

        // query.catch((err) => console.log(err));

        await expect(query).to.be.eventually.rejected.and.has.property('code');
        await expect(query)
            .to.be.eventually.rejected.and.property('code')
            .to.equal(QueryErrorCodes.EmptyQuery);
        await expect(query).to.be.rejectedWith('An empty query was provided');
    });
});

describe('CREATE', () => {
    it('SHOULD CREATE a test user', async () => {
        const r = await db.query.createOne<UserModel>({
            data: { name: 'user1', email: 'user1@mail.com', rank: 1 },
            table: 'users',
            returning: '*',
            columns: ['name', 'email', 'rank']
        });
        expect(r).to.have.keys(['id', 'name', 'email', 'rank']);
    });
    it('SHOULD CREATE 50 test users', async () => {
        const number = 50;
        const data = [...Array(number)].map((_, i) => {
            const user = `user${i + 2}`;
            return { name: user, email: `${user}@mail.com`, rank: i + 2 };
        });

        const r = await db.query.createMany<UserModel>({
            data,
            columns: ['name', 'email', 'rank'],
            table: 'users',
            returning: '*'
        });
        expect(r).to.be.an('array');
        expect(r).to.have.length(number);
        expect(r[0]).to.have.keys(['id', 'name', 'email', 'rank']);
    });
    it('SHOULD THROW ERROR due to unique constraint', async () => {
        const query = db.query.createOne<UserModel>({
            data: { name: 'testUser', email: 'user1@mail.com', rank: 555 },
            table: 'users',
            columns: ['name', 'email', 'rank'],
            returning: '*'
        });

        // query.catch((err) => console.log(err));

        await expect(query).to.be.eventually.rejected.and.has.property('code');
        await expect(query)
            .to.be.eventually.rejected.and.property('code')
            .to.equal('ConstraintViolation');
        await expect(query).to.be.rejectedWith(
            'duplicate key value violates unique constraint'
        );
    });
    it('SHOULD THROW ERROR due to missing required column', async () => {
        const query = db.query.createOne<UserModel>({
            data: { name: null },
            table: 'users',
            returning: '*',
            columns: ['name']
        });

        // query.catch((err) => console.log(err));

        await expect(query).to.be.eventually.rejected.and.has.property('code');
        await expect(query)
            .to.be.eventually.rejected.and.property('code')
            .to.equal('ConstraintViolation');
        await expect(query).to.be.rejectedWith('violates not-null constraint');
    });
});

describe('FIND MANY', () => {
    it('SHOULD FIND many user records', async () => {
        const r = await db.query.findMany<UserModel>({
            query: 'SELECT * FROM users'
        });
        expect(r).to.be.an('array');
        expect(r[0]).to.have.keys(['id', 'name', 'email', 'rank']);
    });
    it('SHOULD FIND one user in "Many" mode (return in array)', async () => {
        const r = await db.query.findMany<UserModel>({
            query: "SELECT * FROM users WHERE email = 'user1@mail.com'"
        });
        expect(r).to.be.an('array');
        expect(r[0]).to.have.keys(['id', 'name', 'email', 'rank']);
    });
    it('SHOULD FIND 5 users with pagination', async () => {
        const r = await db.query.findMany<UserModel>({
            query: 'SELECT * FROM users',
            pagination: { page: 1, pageSize: 5 }
        });
        expect(r).to.be.an('array');
        expect(r).to.have.length(5);
        expect(r[0]).to.have.keys(['id', 'name', 'email', 'rank']);
    });
    it('SHOULD FIND 8 users on page 2 with pagination', async () => {
        const pagination = { page: 2, pageSize: 8 };

        const r = await db.query.findMany<UserModel>({
            query: 'SELECT * FROM users',
            pagination
        });
        expect(r).to.be.an('array');
        expect(r[0]).to.have.keys(['id', 'name', 'email', 'rank']);
        expect(r).to.have.length(pagination.pageSize);
        expect(r[0].rank).to.equal(pagination.pageSize + 1);
        expect(r.slice(-1)[0].rank).to.equal(
            pagination.pageSize * pagination.page
        );
    });
    it('SHOULD FIND 25 users on page with pagination default pageSize', async () => {
        const pagination = { page: 1 };

        const r = await db.query.findMany<UserModel>({
            query: 'SELECT * FROM users',
            pagination
        });
        expect(r).to.be.an('array');
        expect(r[0]).to.have.keys(['id', 'name', 'email', 'rank']);
        expect(r).to.have.length(25);
    });
});

describe('FIND ONE', () => {
    it('SHOULD FIND one user record', async () => {
        const r = await db.query.findOne<UserModel>({
            query: "SELECT * FROM users WHERE email = 'user1@mail.com'"
        });
        expect(r).to.have.keys(['id', 'name', 'email', 'rank']);
    });
    it('SHOULD NOT FIND one user record and return null', async () => {
        const r = await db.query.findOne<UserModel>({
            query: 'SELECT * FROM users WHERE id = 3434'
        });
        expect(r).to.be.null;
    });
    it('SHOULD THROW ERROR due to multiple users returned', async () => {
        const query = db.query.findOne<UserModel>({
            query: 'SELECT * FROM users'
        });

        // query.catch((err) => console.log(err));

        await expect(query).to.be.rejectedWith(
            "Multiple rows were not expected for query return mode 'ONE'"
        );
        await expect(query).to.be.eventually.rejected.and.has.property('code');
        await expect(query)
            .to.be.eventually.rejected.and.property('code')
            .to.equal('MultipleRowsReturned');
    });
    it('SHOULD THROW ERROR due to relation not exist', async () => {
        const query = db.query.findMany<UserModel>({
            query: 'SELECT * FROM users11'
        });

        // query.catch((err) => console.log(err));

        await expect(query).to.be.eventually.rejected.and.has.property('code');
        await expect(query)
            .to.be.eventually.rejected.and.property('code')
            .to.equal('ExecutionError');
        await expect(query).to.be.rejectedWith(
            'relation "users11" does not exist'
        );
    });
    it('SHOULD THROW ERROR due to non-existent column', async () => {
        const query = db.query.findMany<UserModel>({
            query: 'SELECT id, pasta FROM users'
        });

        // query.catch((err) => console.log(err));

        await expect(query).to.be.eventually.rejected.and.has.property('code');
        await expect(query)
            .to.be.eventually.rejected.and.property('code')
            .to.equal('ExecutionError');
        await expect(query).to.be.rejectedWith('column "pasta" does not exist');
    });
});

describe('UPDATE', () => {
    it('SHOULD UPDATE the current test user', async () => {
        const query = db.query.updateOne<UserModel>({
            data: { name: 'testUserUpdated', email: 'test-update@mail.com' },
            table: 'users',
            filter: 'id = 1',
            returning: '*',
            columns: ['name', 'email']
        });

        // query.catch((err) => console.log(err));

        expect(await query).to.have.keys(['id', 'name', 'email', 'rank']);
    });
    it('SHOULD THROW ERROR due to unique constraint', async () => {
        const query = db.query.updateOne<UserModel>({
            data: { email: 'user3@mail.com' },
            columns: ['email'],
            table: 'users',
            returning: '*',
            filter: 'id = 2'
        });

        // query.catch((err) => console.log(err));

        await expect(query).to.be.eventually.rejected.and.has.property('code');
        await expect(query)
            .to.be.eventually.rejected.and.property('code')
            .to.equal('ConstraintViolation');
        await expect(query).to.be.rejectedWith(
            'duplicate key value violates unique constraint'
        );
    });
});

let userQuerySuite: { config: QuerySuite<UserModel>; query: PostgresQuery };
// let cs: unknown;
// let queries: unknown;

describe('QUERY SUITE', () => {
    before(() => {
        userQuerySuite = db.newQuerySuite<UserModel>('users');
    });
    describe('CONFIG', () => {
        it('SHOULD CONFIG ColumnSet', async () => {
            const cs = userQuerySuite.config.columnSets({
                update: ['id', 'name', 'email'],
                create: ['email', 'id', 'name']
            });

            expect(cs).to.have.keys(['update', 'create']);
            expect(cs.create).to.be.an('array');
        });
        it('SHOULD CONFIG QuerySet', async () => {
            const queries = userQuerySuite.config.querySets(
                {
                    get: 'get.sql'
                },
                [__dirname, 'db/queryFiles']
            );

            expect(queries).to.have.keys(['get']);
            expect(queries.get).to.be.an.instanceof(QueryFile);
        });
    });
    describe('CREATE', () => {
        it('SHOULD CREATE AND RETURN a user', async () => {
            const cs = userQuerySuite.config.columnSets({
                create: ['email', 'name', 'rank']
            });

            const r = await userQuerySuite.query.createOne<UserModel>({
                data: {
                    name: 'suiteTest',
                    email: 'suite@email.com',
                    rank: 100
                },
                columns: cs.create,
                returning: '*'
            });

            expect(r).to.have.keys(['id', 'email', 'name', 'rank']);
        });
    });
});

// cleanup
after(async () => {
    // await db.query.run('DROP TABLE IF EXISTS users');
});
