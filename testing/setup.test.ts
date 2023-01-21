import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import mocha from 'mocha';

import { connection } from './setup';
import PostgresClient from '../src';

const { it, describe } = mocha;

chai.use(chaiAsPromised);

const db = new PostgresClient(connection, {
    connect: { testOnInit: false, log: false },
    noWarnings: true
});

describe('SETUP', () => {
    it('SHOULD CREATE users table', async () => {
        await db.query
            .run(
                `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name varchar(255) NOT NULL,
                email varchar(255) NOT NULL,
                rank int NOT NULL UNIQUE,
                optional varchar(255)
            )
            `
            )
            .none();
    });
});
