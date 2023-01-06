import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import mocha from 'mocha';

import PostgresClient from '../src';
import { connection } from './setup';

const { it, describe } = mocha;
const { expect } = chai;

chai.use(chaiAsPromised);

let db: PostgresClient;

describe('SETUP', () => {
    it('SHOULD CONNECT to database with connect method', async () => {
        db = new PostgresClient(connection, {
            connect: { testOnInit: false, log: false },
            noWarnings: true
        });

        const status = await db.connect();
        expect(status).to.have.property('status');
        expect(status.status).to.equal('CONNECTED');
        expect(status).to.have.property('connection');
        expect(status.connection).to.have.property('host');
        expect(status.connection).to.have.property('port');
        expect(status.connection).to.have.property('user');
        expect(status.connection).to.have.property('database');

        await db.close();
    });
    it('SHOULD CONNECT to database on init and return status with status method', async () => {
        db = new PostgresClient(connection, {
            connect: { testOnInit: true, log: false },
            noWarnings: true
        });

        const status = await db.status();
        expect(status).to.have.property('status');
        expect(status.status).to.equal('CONNECTED');
        expect(status).to.have.property('connection');
        expect(status.connection).to.have.property('host');
        expect(status.connection).to.have.property('port');
        expect(status.connection).to.have.property('user');
        expect(status.connection).to.have.property('database');

        await db.close();
    });
    it('SHOULD FAIL to connect to database due to wrong host', async () => {
        const db = new PostgresClient(
            {
                ...connection,
                host: 'wrong'
            },
            { connect: { log: false } }
        );

        const status = await db.status();
        expect(status).to.have.keys([
            'status',
            'connection',
            'error',
            'serverVersion'
        ]);
        expect(status.status).to.equal('FAILED');
        expect(status.error?.code).to.equal('ENOTFOUND');
        expect(status.error?.type).to.equal('HostNotFound');

        expect(status.error?.message).to.include('Connection to the host');

        expect(status.connection).to.have.keys([
            'host',
            'port',
            'user',
            'database',
            'password'
        ]);
    });
    it('SHOULD FAIL to connect to database due to wrong port', async () => {
        const db = new PostgresClient(
            {
                ...connection,
                port: 9999
            },
            { connect: { log: false } }
        );

        const status = await db.status();
        expect(status).to.have.keys([
            'status',
            'connection',
            'error',
            'serverVersion'
        ]);
        expect(status.status).to.equal('FAILED');
        expect(status.error?.message).to.include('Connection to port');
        expect(status.error?.code).to.equal('ECONNREFUSED');
        expect(status.error?.type).to.equal('PortNotResponding');
        expect(status.connection).to.have.keys([
            'host',
            'port',
            'user',
            'database',
            'password'
        ]);
    });
    it('SHOULD FAIL to connect to database due to wrong database', async () => {
        const db = new PostgresClient(
            {
                ...connection,
                database: 'wrong'
            },
            { connect: { log: false } }
        );

        const status = await db.status();
        expect(status).to.have.keys([
            'status',
            'connection',
            'error',
            'serverVersion'
        ]);
        expect(status.status).to.equal('FAILED');
        expect(status.error?.message).to.include('Database');
        expect(status.error?.code).to.equal('3D000');
        expect(status.error?.type).to.equal('DatabaseNotFound');
        expect(status.connection).to.have.keys([
            'host',
            'port',
            'user',
            'database',
            'password'
        ]);
    });
    it('SHOULD FAIL to connect to database due to wrong password', async () => {
        const db = new PostgresClient(
            {
                ...connection,
                password: 'wrong'
            },
            { connect: { log: false } }
        );

        const status = await db.status();
        expect(status).to.have.keys([
            'status',
            'connection',
            'error',
            'serverVersion'
        ]);
        expect(status.status).to.equal('FAILED');
        expect(status.error?.message).to.include('Authentication for user');
        expect(status.error?.code).to.equal('28P01');
        expect(status.error?.type).to.equal('AuthFailed');
        expect(status.connection).to.have.keys([
            'host',
            'port',
            'user',
            'database',
            'password'
        ]);
    });
    it('SHOULD FAIL to connect to database due to wrong user', async () => {
        const db = new PostgresClient(
            {
                ...connection,
                user: 'wrong'
            },
            { connect: { log: false } }
        );

        const status = await db.status();
        expect(status).to.have.keys([
            'status',
            'connection',
            'error',
            'serverVersion'
        ]);
        expect(status.status).to.equal('FAILED');
        expect(status.error?.message).to.include('Authentication for user');
        expect(status.error?.code).to.equal('28P01');
        expect(status.error?.type).to.equal('AuthFailed');
        expect(status.connection).to.have.keys([
            'host',
            'port',
            'user',
            'database',
            'password'
        ]);
    });
});
