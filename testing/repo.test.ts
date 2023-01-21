import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import mocha from 'mocha';

import { connection, UserModel, randomInt } from './setup';
import PostgresClient, { DatabaseRepository } from '../src';

const { it, describe } = mocha;
const { expect } = chai;

chai.use(chaiAsPromised);

const dbClient = new PostgresClient(connection, {
    noWarnings: true,
    connect: { testOnInit: false, log: false },
    query: {
        onReturn(result, query) {
            // console.log(query);
        }
    }
});

class UserRepo extends DatabaseRepository<UserModel> {
    table = 'users';
    sqlFilesDir = [__dirname, 'db/queryFiles'];

    list = (): Promise<UserModel[]> => {
        return this.query.run('SELECT * FROM users').many();
    };

    retrieve = (filter: { id: number }) => {
        const filterSet = this.filterSet({ id: 'EQUAL' });
        return this.query
            .find('SELECT * FROM users', {
                filter: this.applyFilter(filter, filterSet)
            })
            .one<UserModel>();
    };

    total() {
        const file = this.sqlFile('total.sql', [__dirname, 'db', 'queryFiles']);
        return this.query.run(file).one<{ count: number }>();
    }

    add(data: { rank: number; email: string; name: string }) {
        const columns = this.columnSet(['email', 'name', 'rank']);
        return this.query
            .add(data, { returning: '*', columns })
            .one<UserModel>();
    }
}

const db = dbClient.addRepositories({
    user: UserRepo
});

describe('REPO', () => {
    it('SHOULD LIST users records', async () => {
        const r = await db.repos.user.list();

        expect(r).to.be.an('array');
        expect(r[0]).to.have.keys(['id', 'name', 'email', 'rank', 'optional']);
    });
    it('SHOULD RETRIEVE a user record', async () => {
        const r = await db.repos.user.retrieve({ id: 5 });

        expect(r).to.have.keys(['id', 'name', 'email', 'rank', 'optional']);
        expect(r.id).to.equal(5);
    });
    it('SHOULD COUNT user records', async () => {
        const r = await db.repos.user.total();

        expect(r).to.have.keys(['count']);
    });
    it('SHOULD ADD a user record', async () => {
        const rank = randomInt();
        const r = await db.repos.user.add({
            name: `add-${rank}`,
            email: `${rank}@mail.com`,
            rank
        });

        expect(r).to.have.keys(['id', 'name', 'email', 'rank', 'optional']);
    });
});
