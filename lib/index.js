"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_promise_1 = __importDefault(require("pg-promise"));
const chalk_1 = __importDefault(require("chalk"));
class PostgresClient {
    constructor(connection, options = {}) {
        // init
        const pgp = (0, pg_promise_1.default)(options);
        this.db = pgp(connection);
        // test connect
        this.connectionSuccess = false;
        this.connectionConfig = {
            host: connection.host,
            user: connection.user,
            port: connection.port,
            database: connection.database,
            password: '##########'
        };
        this.testConnection();
        // query execution
        this.query = {
            many: (query) => this.runQuery(query),
            single: (query) => this.runQuery(query)
        };
    }
    /**
     * Tests if connection to database can be established
     */
    testConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            const conn = this.connectionConfig;
            yield this.db
                .connect()
                .then((conn) => {
                const { client } = conn;
                console.log(chalk_1.default.green(`Connected to Database "${client.database}" on ${client.host}:${client.port} with user "${client.user}"`));
                this.connectionSuccess = true;
                return conn.done(true);
            })
                .catch((err) => {
                console.error(chalk_1.default.red(`Database Connection failed (${err.message})`));
                console.error(`User\t\t${conn.user}\nHost\t\t${conn.host}\nPort\t\t${conn.port}\nDatabase\t${conn.database}`);
                process.exit(1);
            });
            return this.connectionSuccess;
        });
    }
    runQuery(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db
                .oneOrNone(query)
                .then((res) => {
                return res;
            })
                .catch((err) => {
                console.log('EEE', err);
            });
        });
    }
}
exports.default = PostgresClient;
