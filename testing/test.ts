import DatabaseRepository from '../src/repository';
import PostgresClient from '../src/client';

const connection = {
    host: 'localhost',
    port: 5413,
    user: 'admin',
    password: 'password',
    database: 'app_db'
};

export type User = {
    id: number;
    name: string;
    email: string;
    rank: number;
};
export type Product = {
    id: number;
    product: string;
};

export type Tables = 'users';

class UserRepo extends DatabaseRepository<User> {
    table = 'users';
    sqlFilesDir = [__dirname];

    private filters = this.filterSet({ id: 'INCLUDES' });
    private queries = {
        get: this.sqlFile('testing/db/queryFiles/test.sql')
    };
    private columns = { add: this.columnSet(['name', 'name', 'rank']) };

    add(data: object) {
        const columns = this.columnSet(['id', 'name']);
        return this.query
            .add(data, {
                returning: '*',
                columns
            })
            .one<User>();
    }

    update(data: object, id: number) {
        const columns = this.columnSet(['email']);
        const filter = this.applyFilter({ id }, { id: 'EQUAL' });
        return this.query.update(data, { columns, filter }).one();
    }

    retrieve(id: number): Promise<User> {
        return this.query
            .find('SELECT * FROM users WHERE id = $<id>', {
                params: { id }
            })
            .one();
    }

    list(filters: { id: Array<number> }): Promise<User[]> {
        return this.query
            .find(this.queries.get, {
                filter: this.applyFilter(filters, this.filters)
            })
            .many();
    }
}

const main = async () => {
    const client = new PostgresClient(connection);

    const a = await client.query.run('SELECT * FROM users').many();

    const QueryRepositories = client.addRepositories({
        user: UserRepo
    });
};

main();
