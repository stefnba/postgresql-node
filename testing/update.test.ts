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
