import chai from 'chai';
import mocha from 'mocha';
import PostgresClient from '../src';

const { it, describe } = mocha;
const { expect } = chai;

const connection = {
    user: 'admin',
    host: 'localhost',
    database: 'app_db',
    password: 'password',
    port: 5413
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
    });
});
