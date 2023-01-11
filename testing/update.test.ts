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

describe.only('UPDATE', () => {
    it('SHOULD UPDATE one user record without columns and return updated name', async () => {
        const update = await db.query.update.one<UserModel>({
            data: {
                name: 'UPDATED'
            },
            filter: 'id = 1',
            table: 'users',
            returning: 'name'
        });

        expect(update.name).to.equal('UPDATED');
    });
    it('SHOULD THROW QueryBuildError due to missing table', async () => {
        const rank = randomInt();

        const r = db.query.update.one<UserModel>({
            data: {
                name: `add-${rank}`
            },
            returning: 'id, name'
        });

        await expect(r).to.be.rejectedWith(QueryBuildError);
        await expect(r).to.be.rejectedWith('A table name is required');
        await expect(r).to.be.eventually.rejected.and.has.property('type');
        await expect(r)
            .to.be.eventually.rejected.and.property('type')
            .to.equal('TABLE_NAME_MISSING');
    });
});
