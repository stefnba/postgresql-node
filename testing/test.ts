import DatabaseRepository from '../src/repository';
import PostgresClient from '../src/client';

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
    filters = this.filterSet({ id: 'INCLUDES' });
    queries = {
        get: this.sqlFile('testing/db/queryFiles/test.sql')
    };
    columns = { add: this.columnSet(['name', 'name', 'rank']) };
    sqlFilesDir = [__dirname];

    add(data: object) {
        const cs = this.columnSet(['id', 'name']);
        return this.query.add.one({
            data,
            returning: '*'
            // columns: this.columns.add
        });
    }

    update(data: object): Promise<User> {
        return this.query.update.one({ data });
    }

    retrieve(id: number): Promise<User> {
        return this.query.find.one({
            query: 'SELECT * FROM users WHERE id = $<id>',
            params: { id }
        });
    }

    list(filters: { id: Array<number> }): Promise<User[]> {
        return this.query.find.many({
            query: this.queries.get,
            filter: this.applyFilter(filters, this.filters)
        });
    }
}
class ProductRepo extends DatabaseRepository<Product> {
    table = 'Products';

    add(data: object): Promise<Product> {
        return this.query.add.one<Product>({ data });
    }

    find(): Promise<Product> {
        return this.query.find.one({
            query: 'SELECT * FROM products'
        });
    }

    list(): Promise<Product[]> {
        return this.query.find.many({
            query: 'SELECT * FROM products'
        });
    }

    total() {
        return 2;
    }
}

const connection = {
    host: 'localhost',
    port: 5413,
    user: 'admin',
    password: 'password',
    database: 'app_db'
};

const main = async () => {
    // const client = new PostgresClient(connection, {
    // connect: {
    // onFailed(err, connection) {
    //     console.error('asdfsdf', err, connection);
    // },
    // onSuccess({ database }) {
    //     console.log('asdfasdf', database);
    // },
    // testOnInit: true,
    // logConnect: true
    // }
    // });

    const client = new PostgresClient(connection, {
        // connect: {
        //     onFailed: (err, connection) => {
        //         console.log(err, connection);
        //     }
        // }
        // query: {
        //     onReturn: () => console.log(1)
        // }
    });

    const aaaaa = await client.query.run.many<User>('SELECT * FROM users', {});

    console.log(aaaaa);

    const QueryRepositories = client.addRepositories({
        user: UserRepo,
        product: ProductRepo
    });

    const user111 = await QueryRepositories.user.list({ id: [1, 2] });
    const user121 = await QueryRepositories.user.retrieve(23);
    console.log(user121);
    await QueryRepositories.user.add({
        email: 'me',
        name: 'asdfdsf',
        rank: 111
    });

    const { query } = client;

    // const b = await QueryRepositories.product.list();
    const users = await query.find.many<User>({
        query: 'SELECT * FROM users WHERE id = 22',
        params: { id: 1 }
    });
    const user = await query.find.one<User>({
        query: 'SELECT * FROM users WHERE id = $<id>',
        params: { id: 1 }
    });

    // await query.add.one({
    //     data: { name: 'asdf' },
    //     columns: ['d'],
    //     table: 'users',
    //     returning: '*'
    // });
    await query.update.one({ data: { name: 'asdf' }, table: 'users' });
};

main();
