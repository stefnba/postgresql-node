import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import mocha from 'mocha';

import { connection, UserModel } from './setup';
import PostgresClient from '../src';

const { it, describe } = mocha;
const { expect } = chai;

chai.use(chaiAsPromised);

const db = new PostgresClient(connection, {
    noWarnings: true,
    connect: { testOnInit: false, log: false },
    query: {
        onReturn(result, query) {
            // console.log(query);
        }
    }
});

describe('RUN', () => {
    it('SHOULD RUN simple query', async () => {
        const r = await db.query.run.one<{ now: Date }>({
            query: 'SELECT NOW()'
        });

        expect(r).to.have.key('now');
    });
    it('SHOULD RUN SELECT query with params to retrieve one user', async () => {
        const r = await db.query.run.one<UserModel>({
            query: 'SELECT * from users WHERE id = $<id>',
            params: { id: 1 }
        });

        expect(r).to.have.keys(['id', 'name', 'email', 'rank']);
    });
});
