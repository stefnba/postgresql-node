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
    },
    noWarnings: true
});

describe('FIND', () => {
    describe('MANY', () => {
        it('SHOULD LIST all user records', async () => {
            const r = await db.query
                .find('SELECT * FROM Users')
                .many<UserModel>();

            expect(r).to.be.an('array');
            expect(r[0]).to.have.keys(['id', 'name', 'email', 'rank']);
        });
        it('SHOULD LIST 15 user records', async () => {
            const count = 15;
            const r = await db.query
                .find('SELECT * FROM Users', {
                    pagination: { pageSize: count, page: 1 }
                })
                .many<UserModel>();

            expect(r).to.be.an('array');
            expect(r).to.have.length(count);
            expect(r[0]).to.have.keys(['id', 'name', 'email', 'rank']);
        });
    });
    describe('ONE', () => {
        it('SHOULD LIST one user record', async () => {
            const r = await db.query
                .find('SELECT * FROM Users WHERE id = 1')
                .one<UserModel>();

            expect(r).to.have.keys(['id', 'name', 'email', 'rank']);
        });
        it('SHOULD LIST one user record with param id provided', async () => {
            const r = await db.query
                .find('SELECT * FROM Users WHERE id = $<id>', {
                    params: { id: 1 }
                })
                .one<UserModel>();

            expect(r).to.have.keys(['id', 'name', 'email', 'rank']);
            expect(r.id).to.equal(1);
        });
    });
});
