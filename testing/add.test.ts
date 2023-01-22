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
        const rank = randomInt();
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
        const rank = randomInt();
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
        const rank = randomInt();
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
        expect(r).to.have.keys(['id', 'name', 'email', 'rank', 'optional']);
    });
    it('SHOULD ADD one user record with columns and return record with only id, name columns', async () => {
        const rank = randomInt();
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
    it('SHOULD ADD 15 user records with columns and return records', async () => {
        const rank = randomInt();

        const number = 15;

        const data = Array.from(Array(number).keys()).map((i) => ({
            name: `add-${rank + i}`,
            email: `${rank + i}@mail.com`,
            rank: rank + i
        }));

        const r = await db.query
            .add(data, {
                returning: '*',
                columns: ['name', 'email', 'rank'],
                table: 'users'
            })
            .many<UserModel>();
        expect(r).to.have.length(number);
        expect(r[0]).to.have.keys(['id', 'name', 'email', 'rank', 'optional']);
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
    it('SHOULD THROW QueryBuildError since not data is provided (array)', async () => {
        const r = () =>
            db.query.add([], {
                columns: [],
                returning: '*',
                table: 'users'
            });
        expect(r)
            .to.throw(
                QueryBuildError,
                'No data was provided. INSERT query cannot be generated'
            )
            .and.property('type')
            .to.equal('EMPTY_DATA');
    });
    it('SHOULD THROW QueryBuildError since not data is provided (object)', async () => {
        const r = () =>
            db.query.add({}, { columns: [], returning: '*', table: 'users' });

        expect(r)
            .to.throw(
                QueryBuildError,
                'No data was provided. INSERT query cannot be generated'
            )
            .and.property('type')
            .to.equal('EMPTY_DATA');
    });
});
