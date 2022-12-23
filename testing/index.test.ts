import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import mocha from 'mocha';
import dotenv from 'dotenv';

import PostgresClient from '../src';
import QueryError from '../src/errors';
import { QueryErrorCodes } from '../src/constants';

const { it, describe } = mocha;
const { expect } = chai;
chai.use(chaiAsPromised);
dotenv.config();

const userId = Math.round(Math.random() * 10000000);

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
            expect(status.message).to.include('getaddrinfo ENOTFOUND wrong');
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
        await db.query.run(
            'CREATE TABLE IF NOT EXISTS users (id int UNIQUE NOT NULL, name varchar NOT NULL, email varchar NOT NULL)',
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
        const r = await db.query.create<UserModel>({
            data: { id: userId, name: 'testUser', email: 'test@mail.com' },
            table: 'users',
            returning: '*'
        });
        expect(r).to.have.keys(['id', 'name', 'email']);
    });
    it('SHOULD CREATE multiple test users', async () => {
        const r = await db.query.createMany<UserModel>({
            data: [
                { id: userId + 1, name: 'testUser', email: 'test@mail.com' },
                { id: userId + 2, name: 'testUser', email: 'test@mail.com' }
            ],
            table: 'users',
            returning: '*'
        });
        expect(r).to.be.an('array');
        expect(r[0]).to.have.keys(['id', 'name', 'email']);
    });
    it('SHOULD THROW ERROR due to unique constraint', async () => {
        const query = db.query.create<UserModel>({
            data: { id: userId, name: 'testUser', email: 'test@mail.com' },
            table: 'users',
            returning: '*'
        });

        query.catch((err) => console.log(err));

        await expect(query).to.be.eventually.rejected.and.has.property('code');
        await expect(query)
            .to.be.eventually.rejected.and.property('code')
            .to.equal('ConstraintViolation');
        await expect(query).to.be.rejectedWith(
            'duplicate key value violates unique constraint'
        );
    });
    it('SHOULD THROW ERROR due to missing required column', async () => {
        const query = db.query.create<UserModel>({
            data: { name: 'testUser', email: 'test@mail.com' },
            table: 'users',
            returning: '*'
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
        expect(r[0]).to.have.keys(['id', 'name', 'email']);
    });
    it('SHOULD FIND one user in "Many" mode (return in array)', async () => {
        const r = await db.query.findMany<UserModel>({
            query: `SELECT * FROM users WHERE id = ${userId}`
        });
        expect(r).to.be.an('array');
        expect(r[0]).to.have.keys(['id', 'name', 'email']);
    });
});

describe('FIND ONE', () => {
    it('SHOULD FIND one user record', async () => {
        const r = await db.query.findOne<UserModel>({
            query: `SELECT * FROM users WHERE id = ${userId}`
        });
        expect(r).to.have.keys(['id', 'name', 'email']);
    });
    it('SHOULD NOT FIND one user record and return null', async () => {
        const r = await db.query.findOne<UserModel>({
            query: `SELECT * FROM users WHERE id = ${userId * 2}`
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

        query.catch((err) => console.log(err));

        await expect(query).to.be.eventually.rejected.and.has.property('code');
        await expect(query)
            .to.be.eventually.rejected.and.property('code')
            .to.equal('ExecutionError');
        await expect(query).to.be.rejectedWith('column "pasta" does not exist');
    });
});

describe('UPDATE', () => {
    it('SHOULD UPDATE the current test user', async () => {
        const query = db.query.update<UserModel>({
            data: { id: userId, name: 'testUser', email: 'test@mail.com' },
            table: 'users',
            filter: `id = ${userId}`,
            returning: '*'
        });

        query.catch((err) => console.log(err));

        expect(await query).to.have.keys(['id', 'name', 'email']);
    });
    it('SHOULD THROW ERROR due to unique constraint', async () => {
        const query = db.query.update<UserModel>({
            data: { id: userId },
            table: 'users',
            returning: '*',
            filter: `id = ${userId + 1}`
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

// cleanup
after(async () => {
    // await db.query.run('DROP TABLE IF EXISTS users');
});
