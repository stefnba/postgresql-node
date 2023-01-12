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
            console.log(query);
        }
    }
});

class UserRepo extends DatabaseRepository<UserModel> {
    table = 'users';
    sqlFilesDir = [__dirname, 'db/queryFiles'];

    list = (): Promise<UserModel[]> => {
        return this.query.run.many('SELECT * FROM users');
    };

    retrieve = (filter: { id: number }) => {
        const filterSet = this.filterSet({ id: 'EQUAL' });
        return this.query.find.one<UserModel>({
            query: 'SELECT * FROM users',
            filter: this.applyFilter(filter, filterSet)
        });
    };

    total(): Promise<{ count: number }> {
        const file = this.sqlFile('total.sql', [__dirname, 'db', 'queryFiles']);
        return this.query.run.one(file);
    }

    add(data: {
        rank: number;
        email: string;
        name: string;
    }): Promise<UserModel> {
        const columns = this.columnSet(['email', 'name', 'rank']);
        return this.query.add.one({ data, returning: '*', columns });
    }
}

const DatabaseRepos = dbClient.addRepositories({
    user: UserRepo
});

describe.only('REPO', () => {
    it('SHOULD LIST users records', async () => {
        const r = await DatabaseRepos.user.list();

        expect(r).to.be.an('array');
        expect(r[0]).to.have.keys(['id', 'name', 'email', 'rank']);
    });
    it('SHOULD RETRIEVE a user record', async () => {
        const r = await DatabaseRepos.user.retrieve({ id: 5 });

        expect(r).to.have.keys(['id', 'name', 'email', 'rank']);
        expect(r.id).to.equal(5);
    });
    it('SHOULD COUNT user records', async () => {
        const r = await DatabaseRepos.user.total();

        expect(r).to.have.keys(['count']);
    });
    it('SHOULD ADD a user record', async () => {
        const rank = randomInt();
        const r = await DatabaseRepos.user.add({
            name: `add-${rank}`,
            email: `${rank}@mail.com`,
            rank
        });

        expect(r).to.have.keys(['id', 'name', 'email', 'rank']);
    });
});
