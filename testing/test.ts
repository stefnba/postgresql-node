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
    sqlFilesDir = [__dirname, 'db/queryFiles'];

    private filters = this.filterSet({ id: 'INCLUDES' });
    private queries = {
        get: this.sqlFile('test.sql'),
        a: this.sqlFile('test.sql')
    };
    private columns = { add: this.columnSet(['name', 'name', 'rank']) };

    add(data: object) {
        const columns = this.columnSet(['id', 'name']);
        return this.query
            .add(data, {
                returning: '*',
                columns: ['email']
            })
            .one<User>();
    }

    update(data: object, id: number) {
        const columns = this.columnSet(['email']);
        const filter = this.applyFilter({ id }, { id: 'EQUAL' });
        return this.query
            .update(data, {
                columns: [{ name: 'email', optional: true }],
                filter
            })
            .one<User>();
    }

    retrieve(id: number) {
        return this.query
            .find('SELECT * FROM users WHERE id = $<id>', {
                params: { id }
            })
            .one<User>();
    }

    list(filters?: { id: Array<number> }) {
        return this.query
            .find(this.queries.get, {
                filter: {
                    filter: filters,
                    filterSet: { id: { column: 'email', operator: 'EQUAL' } }
                },
                pagination: { pageSize: 3 }
            })
            .many<User>();
        // return this.query
        //     .find(this.queries.get, {
        //         filter: this.applyFilter(filters, this.filters)
        //     })
        //     .many();
    }
}

const main = async () => {
    const client = new PostgresClient(connection);

    const a = await client.query.run('SELECT * FROM users').many();

    const b = await client.query
        .find<User>('SELECT * FROM users', { pagination: { pageSize: 3 } })
        .many<User>();

    console.log(b);

    const QueryRepo = client.addRepositories({
        user: UserRepo
    });

    const c = await QueryRepo.user.list();

    console.log(c);

    // client.query.transaction(async (t) => {
    //     await t.add<User>({ id: 1 }, { columns: ['email'] }).many();
    // });
};

main();
