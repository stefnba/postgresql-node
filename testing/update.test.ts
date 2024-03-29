import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import mocha from 'mocha';

import { QueryBuildError, QueryExecutionError } from '../src/error';
import { connection, UserModel, randomInt } from './setup';
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

describe('UPDATE', () => {
    it('SHOULD UPDATE one user record without columns and return updated name', async () => {
        const update = await db.query
            .update(
                {
                    name: 'UPDATED'
                },
                {
                    filter: 'id = 1',
                    table: 'users',
                    returning: 'name'
                }
            )
            .one<UserModel>();

        expect(update.name).to.equal('UPDATED');
    });
    it('SHOULD UPDATE one user record with shorthand', async () => {
        const update = await db.query
            .update(
                {
                    name: 'UPDATED_SHORT'
                },
                'users',
                'id = 1'
            )
            .one<UserModel>();

        expect(update.name).to.equal('UPDATED_SHORT');
    });
    it('SHOULD UPDATE multiple user records', async () => {
        const r = await db.query
            .update<UserModel>(
                [
                    {
                        name: 'UPDATED',
                        id: 2
                    },
                    {
                        name: 'UPDATED',
                        id: 3
                    }
                ],
                {
                    table: 'users',
                    columns: ['name', { name: 'id', cnd: true }],
                    returning: 't.name, t.id'
                }
            )
            .many<UserModel>();

        expect(r).to.have.length(2);
        expect(r[0].name).to.equal('UPDATED');
        expect(r[0].id).to.equal(2);
        expect(r[1].name).to.equal('UPDATED');
        expect(r[1].id).to.equal(3);
    });
    it('SHOULD THROW QueryBuildError due to missing columns for updating multiple records', async () => {
        const r = () =>
            db.query.update(
                [
                    {
                        name: 'UPDATED',
                        id: 2
                    },
                    {
                        name: 'UPDATED',
                        id: 3
                    }
                ],
                {
                    table: 'users',
                    returning: 'name'
                }
            );

        expect(r)
            .to.throw(
                QueryBuildError,
                "Parameter 'columns' is required when updating multiple records."
            )
            .and.property('type')
            .to.equal('COLUMNS_MISSING');
    });
    it('SHOULD THROW QueryBuildError due to missing table', async () => {
        const rank = randomInt();

        const r = () =>
            db.query.update(
                {
                    name: `add-${rank}`
                },
                {
                    returning: 'id, name'
                }
            );

        expect(r)
            .to.throw(QueryBuildError, 'A table name is required')
            .and.property('type')
            .to.equal('TABLE_NAME_MISSING');
    });
});
