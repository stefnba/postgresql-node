import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import mocha from 'mocha';

import { connection, UserModel } from './setup';
import PostgresClient from '../src';

const { it, describe } = mocha;
const { expect } = chai;

chai.use(chaiAsPromised);

const db = new PostgresClient(connection, {
    connect: { testOnInit: false, log: false },
    query: {
        onReturn(result, query) {
            // console.log(query);
        }
    }
});

describe('FIND', () => {
    describe('MANY', () => {
        it('SHOULD LIST all user records', async () => {
            const r = await db.query.find.many<UserModel>({
                query: 'SELECT * FROM Users'
            });

            expect(r).to.be.an('array');
            expect(r[0]).to.have.keys(['id', 'name', 'email', 'rank']);
        });
        it('SHOULD LIST 15 user records', async () => {
            const count = 15;
            const r = await db.query.find.many<UserModel>({
                query: 'SELECT * FROM Users',
                pagination: { pageSize: count, page: 1 }
            });

            expect(r).to.be.an('array');
            expect(r).to.have.length(count);
            expect(r[0]).to.have.keys(['id', 'name', 'email', 'rank']);
        });
    });
});
