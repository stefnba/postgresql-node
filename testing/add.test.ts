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

describe('ADD', () => {
    it('SHOULD ADD one user record without columns and return nothing', async () => {
        const rank = randomInt(1000000);
        await db.query
            .add(
                {
                    name: `add-${rank}`,
                    email: `${rank}@mail.com`,
                    rank: rank
                },
                {
                    table: 'users'
                }
            )
            .none();
    });
    it('SHOULD ADD one user record with columns and return nothing', async () => {
        const rank = randomInt(1000000);
        await db.query
            .add(
                {
                    name: `add-${rank}`,
                    email: `${rank}@mail.com`,
                    rank: rank
                },
                {
                    columns: ['name', 'email', 'rank'],
                    table: 'users'
                }
            )
            .none();
    });
    it('SHOULD ADD one user record with columns and return record', async () => {
        const rank = randomInt(1000000);
        const r = await db.query
            .add(
                {
                    name: `add-${rank}`,
                    email: `${rank}@mail.com`,
                    rank: rank
                },
                {
                    returning: '*',
                    columns: ['name', 'email', 'rank'],
                    table: 'users'
                }
            )
            .one<UserModel>();
        expect(r).to.have.keys(['id', 'name', 'email', 'rank']);
    });
    it('SHOULD ADD one user record with columns and return record with only id, name columns', async () => {
        const rank = randomInt(1000000);
        const r = await db.query
            .add(
                {
                    name: `add-${rank}`,
                    email: `${rank}@mail.com`,
                    rank: rank
                },
                {
                    returning: 'id, name',
                    columns: ['name', 'email', 'rank'],
                    table: 'users'
                }
            )
            .one<UserModel>();
        expect(r).to.have.keys(['id', 'name']);
    });
    it('SHOULD ADD three user records with columns and return records', async () => {
        const rank = randomInt(1000000);
        const r = await db.query
            .add(
                [
                    {
                        name: `add-${rank + 1}`,
                        email: `${rank + 1}@mail.com`,
                        rank: rank + 1
                    },
                    {
                        name: `add-${rank + 2}`,
                        email: `${rank + 2}@mail.com`,
                        rank: rank + 2
                    },
                    {
                        name: `add-${rank + 3}`,
                        email: `${rank + 3}@mail.com`,
                        rank: rank + 3
                    }
                ],
                {
                    returning: '*',
                    columns: ['name', 'email', 'rank'],
                    table: 'users'
                }
            )
            .many<UserModel>();
        expect(r).to.have.length(3);
        expect(r[0]).to.have.keys(['id', 'name', 'email', 'rank']);
    });
    it('SHOULD THROW QueryBuildError due to missing table', async () => {
        const rank = randomInt(1000000);

        const r = () =>
            db.query.add(
                {
                    name: `add-${rank}`,
                    email: `${rank}@mail.com`,
                    rank: rank
                },
                {
                    returning: 'id, name',
                    columns: ['name', 'email', 'rank']
                }
            );

        expect(r)
            .to.throw(QueryBuildError, 'A table name is required')
            .and.property('type')
            .to.equal('TABLE_NAME_MISSING');
    });
    it('SHOULD THROW QueryExecutionError with type NOT_NULL_VIOLATION due to missing rank in columns', async () => {
        const rank = randomInt(1000000);

        const r = db.query
            .add(
                {
                    name: `add-${rank}`,
                    email: `${rank}@mail.com`,
                    rank: rank
                },
                {
                    returning: 'id, name',
                    columns: ['name', 'email'],
                    table: 'users'
                }
            )
            .none();

        await expect(r)
            .to.eventually.rejectedWith(
                QueryExecutionError,
                'null value in column "rank" of relation "users" violates not-null constraint'
            )
            .and.property('type')
            .to.equal('NOT_NULL_VIOLATION');
    });
    it('SHOULD THROW QueryBuildError with type DATA_PROPERTY_MISSING due to missing required data property', async () => {
        const rank = randomInt(1000000);

        const r = () =>
            db.query
                .add(
                    {
                        name: `add-${rank}`,
                        email: `${rank}@mail.com`
                    },
                    {
                        returning: 'id, name',
                        columns: ['name', 'email', 'rank'],
                        table: 'users'
                    }
                )
                .one<UserModel>();

        expect(r)
            .to.throw(QueryBuildError, "Property 'rank' doesn't exist")
            .and.property('type')
            .to.equal('DATA_PROPERTY_MISSING');
    });
    it('SHOULD THROW QueryExecutionError with type DATA_PROPERTY_MISSING due to missing required data property', async () => {
        const rank = randomInt(1000000);

        const r = db.query
            .add(
                {
                    name: `add-${rank}`,
                    email: `${rank}@mail.com`,
                    rank: 'dddd'
                },
                {
                    returning: 'id, name',
                    columns: ['name', 'email', 'rank'],
                    table: 'users'
                }
            )
            .none();

        await expect(r)
            .to.eventually.be.rejectedWith(
                QueryExecutionError,
                'invalid input syntax for type integer'
            )
            .and.property('type')
            .to.equal('INVALID_TEXT_REPRESENTATION');
    });
});
