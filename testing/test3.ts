import PostgresClient from '../src/client';

const connection = {
    host: 'localhost',
    port: 5413,
    user: 'admin',
    password: 'password',
    database: 'app_db'
};

const main = async () => {
    const client = new PostgresClient(connection);

    const query = client.query;

    await query.transaction(async (t) => {
        await t.run.none({
            query: "UPDATE users SET name = 'asdfsfdsadf323322'"
        });
        await t.add.none({ data: { id: 1 }, table: 'users' });
    });
};

main();
