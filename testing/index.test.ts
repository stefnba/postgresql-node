import PostgresClient from '../src';

const connection = {
    user: 'admin',
    host: 'localhost',
    database: 'app_db',
    password: 'password',
    port: 5410
};

const db = new PostgresClient(connection);

const test = async () => {
    const r = await db.query.single<{ now: Date }>('SELECT NOW()');
    console.log(r);
};

test();
