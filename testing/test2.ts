import pgPromise from 'pg-promise';

import { connection } from './setup';

const pgp = pgPromise();

const db = pgp(connection);

const app = async () => {
    const r = await db.oneOrNone('BEGIN;');
    const a = await db.oneOrNone('BEGIN; SELECT * FROM USERS; COMMIT;');
    console.log(r, a);
    // await db
    //     .tx(async (t) => {
    //         await t.manyOrNone("UPDATE users set name='asdsdsada11111'");
    //         await t.oneOrNone('INSERT INTO users(id) Values(1)');

    //         return { code: 123 };
    //     })
    //     .then((data) => {
    //         console.log(data);
    //     })
    //     .catch((err) => {
    //         console.log(err);
    //     });
};

app();
