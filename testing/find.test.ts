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
        it('SHOULD FIND all user records', async () => {
            const r = await db.query
                .find('SELECT * FROM Users')
                .many<UserModel>();

            expect(r).to.be.an('array');
            expect(r[0]).to.have.keys([
                'id',
                'name',
                'email',
                'rank',
                'optional'
            ]);
        });
        it('SHOULD FIND 15 user records', async () => {
            const count = 15;
            const r = await db.query
                .find('SELECT * FROM Users', {
                    pagination: { pageSize: count, page: 1 }
                })
                .many<UserModel>();

            expect(r).to.be.an('array');
            expect(r).to.have.length(count);
            expect(r[0]).to.have.keys([
                'id',
                'name',
                'email',
                'rank',
                'optional'
            ]);
        });
    });
    describe('ONE', () => {
        it('SHOULD FIND one user record', async () => {
            const r = await db.query
                .find('SELECT * FROM Users WHERE id = 1')
                .one<UserModel>();

            expect(r).to.have.keys(['id', 'name', 'email', 'rank', 'optional']);
        });
        it('SHOULD FIND one user record with param id provided', async () => {
            const r = await db.query
                .find('SELECT * FROM Users WHERE id = $<id>', {
                    params: { id: 1 }
                })
                .one<UserModel>();

            expect(r).to.have.keys(['id', 'name', 'email', 'rank', 'optional']);
            expect(r.id).to.equal(1);
        });
        it('SHOULD FIND one user record with filter object', async () => {
            const r = await db.query
                .find('SELECT * FROM Users', {
                    filter: { filter: { id: 1 }, filterSet: { id: 'EQUAL' } }
                })
                .one<UserModel>();

            expect(r).to.have.keys(['id', 'name', 'email', 'rank', 'optional']);
            expect(r.id).to.equal(1);
        });
        it('SHOULD FIND one user record with filter string', async () => {
            const r = await db.query
                .find('SELECT * FROM Users', {
                    filter: 'id = 1'
                })
                .one<UserModel>();

            expect(r).to.have.keys(['id', 'name', 'email', 'rank', 'optional']);
            expect(r.id).to.equal(1);
        });
    });
});
