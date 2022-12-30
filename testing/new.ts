import PostgresClient from '../src';

const connection = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 30
};

const main = async () => {
    const client = new PostgresClient(connection);

    console.log(client);

    await client.close();
    console.log(client);
};

main();
