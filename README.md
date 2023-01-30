# postgresql-node

**IMPORTANT:** This repository is work in progress.

PostgreSQL interface for Node.js with TypeScript to simplify common database interactions and error handling. Built on top of the awesome [pg-promise](https://github.com/vitaly-t/pg-promise) package.

# Setup

```ts
import PostgresClient from 'postgresql-node';

const db = new PostgresClient({
    host: 'host',
    port: 5432,
    database: 'database',
    user: 'user',
    password: 'password'
});
```

# Queries

Running a query against the database consists of two methods.

1. Constructing the query
2. Executing the constructed query and returning results

Both methods can be chained together. But it is important to know that the query won't be excecuted until one of the Query methods, e.g. `.one()`, `.many()` or `.none()` is called.

```ts
await db.query.run('SELECT NOW()').none();
```

## RUN

`db.query.add()` can be used to run any query.

```ts
const users = await db.query.run('SELECT * FROM users').none();
```

## FIND

The `db.query.find()` method is itended to simplify `SELECT` queries.

```ts
const users = await db.query.find('SELECT * FROM users').many();
```

This method provides additional helpers that come in handy with `SELECT` queries.

### Filter

### Pagination

### Ordering

### Parameters

## UPDATE

`db.query.update()` method is itended to simplify `UPDATE` queries.

```ts
const data = {
    name: 'testUser';
    email: 'user@mail.com';
};
const users = await db.query.update(data).one();
```

This method provides additional helpers that come in handy with `UPDATE` queries.

### Filter

### Returning Results

### Limit columns that are allowed to be updated

## ADD

`db.query.add()` method is itended to simplify `INSERT` queries.

```ts
const data = {
    name: 'testUser';
    email: 'user@mail.com';
};
await db.query.add(data).none();
```

## BATCH

All of the above query methods use a single connection pool that is closed after the query is executed.

```ts
const orders = await db.query.batch(async (t) => {
    const user = await t.find('SELECT * FROM USERS', { filter: 1 }).one();
    const orders = await t.find('SELECT * FROM orders', { filter: 1 }).many();
    return orders;
});
```

## TRANSACTION

A transaction is all-or-nothing method which either runs all specified queries and committ them to the database or none and a rollback is executed. the .transaction() method automatically applied `BEGIN` and `COMMIT` or `ROLLBACK` commands.

```ts
const bb = await db.query.transaction(async (t) => {
    console.log(t.run('SELECT NOW()'));

    const a = await t.run('SELECT * FROM USERS where id =1').oneOrNone();
    await t.add({ name: 'd', rank, email: `${rank}@mail.com` }, 'users').none();
});
```

# Repositories

Repositories provide further simplification to interact with one table in a database. They allow to centralize queries for the that table and specify parameters and return values as well as filters, columns and types that can be used with a query.

```ts
const db = new PostgresClient(connection);

const repos = db.addRepositories({
    user: UserRepo
});

type UserModel = {
    id: number;
    name: string;
    email: string;
};

class UserRepo extends DatabaseRepository<UserModel> {
    // specify table name for this repository
    table = 'users';
    // specify directory that contains SQL files for this repo
    sqlFilesDir = [__dirname, 'sqlFiles'];
    // specify filterSet that can be referenced within the Repo
    filterSet = this.filterSet({ id: 'INCLUDES' });
    // specify columnSet that can be referenced within the Repo
    columns = this.columnSet(['name', 'name', 'rank']);
    // specify columnSet that can be referenced within the Repo
    // if sqlFilesDir is specified, it is included
    queries = this.sqlFile('sqlFile.sql');

    find(id: number) {
        return this.query
            .find('SELECT * FROM users WHERE id = $<id>', { id })
            .one<UserModel>();
    }

    add(data: UserModel) {
        return this.query.add(data).one<UserModel>();
    }
}
```
