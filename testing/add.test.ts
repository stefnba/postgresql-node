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

describe('ADD', () => {
    describe('ONE', () => {
        it('SHOULD ADD one user record without columns and return nothing', async () => {
            await db.query.add.none({
                data: {
                    name: 'test1',
                    email: '',
                    rank: 1
                },
                table: 'users'
            });
        });
        it('SHOULD ADD one user record with columns and return nothing', async () => {
            await db.query.add.none({
                data: {
                    name: 'test1',
                    email: '',
                    rank: 1
                },
                columns: ['name', 'email', 'rank'],
                table: 'users'
            });
        });
        it('SHOULD ADD one user record with columns and return record', async () => {
            const r = await db.query.add.one<UserModel>({
                data: {
                    name: 'test1',
                    email: '',
                    rank: 1
                },
                returning: '*',
                columns: ['name', 'email', 'rank'],
                table: 'users'
            });
            expect(r).to.have.keys(['id', 'name', 'email', 'rank']);
        });
    });
});
