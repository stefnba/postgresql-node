import chai from 'chai';
import mocha from 'mocha';
import dotenv from 'dotenv';

import PostgresClient from '../src';

const { it, describe } = mocha;
const { expect } = chai;
dotenv.config();

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

describe('PostgresClient', () => {
    describe('HOME', () => {
        it('SHOULD connect to database', async () => {
            db = new PostgresClient(connection);

            expect(await db.testConnection()).to.be.true;
        });
        it('SHOULD run test query', async () => {
            const r = await db.query.single<{ now: Date }>('SELECT NOW()');
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
