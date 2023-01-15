import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import mocha from 'mocha';

import { connection, UserModel, randomInt } from './setup';
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
        const r = await db.query
            .run('SELECT NOW()', {
                id: 1222
            })
            .one<{ now: Date }>();

        expect(r).to.have.key('now');
    });
    it('SHOULD RUN SELECT query with params to retrieve one user', async () => {
        const r = await db.query
            .run('SELECT * from users WHERE id = $<id>', { id: 1 })
            .one<UserModel>();

        expect(r).to.have.keys(['id', 'name', 'email', 'rank']);
    });
    it('SHOULD INSERT ONE USER with run query', async () => {
        const rank = randomInt();
        const r = await db.query
            .run(
                "INSERT INTO users(name, email, rank) VALUES ('RUN-Test', $<email>, $<rank>) RETURNING *",
                {
                    email: `${rank}@mail.com`,
                    rank
                }
            )
            .one<UserModel>();

        expect(r).to.have.keys(['id', 'name', 'email', 'rank']);
    });
    it('SHOULD SELECT all users with run query and no params', async () => {
        const r = await db.query.run('SELECT * from users').many<UserModel>();

        expect(r).to.be.an('array');
        expect(r[0]).to.have.keys(['id', 'name', 'email', 'rank']);
    });
    it('SHOULD LOG query and results via onReturn function', async () => {
        let query = '';
        let result: object[] = [];

        const dbNew = new PostgresClient(connection, {
            noWarnings: true,
            connect: { testOnInit: false, log: false },
            query: {
                onReturn(_result, queryLog) {
                    query = queryLog;
                    result = _result as object[];
                }
            }
        });

        await dbNew.query.run('SELECT * FROM users').many();

        expect(query).to.be.a('string');
        expect(query).to.equal('SELECT * FROM users');
        expect(result).to.be.an('array');
        expect(result[0]).to.have.keys(['id', 'name', 'email', 'rank']);
    });
});
