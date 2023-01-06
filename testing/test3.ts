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

    console.log(query);

    await query.transaction(async (t) => {
        // console.log(11, await t.any("UPDATE users SET name = 'st'"));
        console.log(
            11,
            // await t.run.one({ query: "UPDATE users SET name = 'st'" })
            await t.run.one({ query: 'SELECT NOW()' })
        );
        console.log(
            11,
            await t.run.none({ query: "UPDATE users SET rank = '1233333A'" })
        );
    });
};

main();
