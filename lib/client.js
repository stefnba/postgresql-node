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
const query_1 = __importDefault(require("./query"));
const suite_1 = __importDefault(require("./suite"));
class PostgresClient {
    constructor(connection, options = {
        testConnection: false
    }) {
        var _a;
        // init
        const pgp = (0, pg_promise_1.default)();
        this.db = pgp(connection);
        this.initOptions = options;
        // test connect
        this.connectionSuccess = false;
        this.connectionConfig = {
            host: connection.host,
            user: connection.user,
            port: connection.port,
            database: connection.database,
            password: '##########' // hide password
        };
        if (options === null || options === void 0 ? void 0 : options.testConnection) {
            this.status();
        }
        // query execution
        this.query = new query_1.default(this.db, {
            queryError: (_a = options.error) === null || _a === void 0 ? void 0 : _a.query
        });
    }
    /**
     * Tests if connection to database can be established
     */
    status(options = { logging: true }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = yield this.db.connect();
                const { client } = connection;
                connection.done(true);
                this.connectionSuccess = true;
                if (options.logging) {
                    console.log(chalk_1.default.green(`Connected to Database "${client.database}" on ${client.host}:${client.port} with user "${client.user}"`));
                }
                return {
                    status: 'CONNECTED',
                    connection: {
                        host: this.connectionConfig.host,
                        port: this.connectionConfig.port,
                        database: this.connectionConfig.database,
                        user: this.connectionConfig.user,
                        password: this.connectionConfig.password
                    }
                };
            }
            catch (err) {
                if (options.logging) {
                    console.error(chalk_1.default.red(`Database Connection failed (${err.message})`));
                    console.error(`Host\t\t${this.connectionConfig.host}`);
                    console.error(`Port\t\t${this.connectionConfig.port}`);
                    console.error(`Database\t${this.connectionConfig.database}`);
                    console.error(`User\t\t${this.connectionConfig.user}`);
                    console.error(`Password\t${this.connectionConfig.password}`);
                }
                return {
                    status: 'FAILED',
                    message: err.message,
                    connection: {
                        host: this.connectionConfig.host,
                        port: this.connectionConfig.port,
                        database: this.connectionConfig.database,
                        user: this.connectionConfig.user,
                        password: this.connectionConfig.password
                    }
                };
            }
        });
    }
    /**
     * Creates Query Suite which simplifies queries and incorporates types
     * @param table
     * @returns query and config methods
     */
    newQuerySuite(table) {
        var _a;
        const query = new query_1.default(this.db, {
            queryError: (_a = this.initOptions.error) === null || _a === void 0 ? void 0 : _a.query,
            table
        });
        const suite = new suite_1.default(table);
        return {
            config: suite,
            query
        };
    }
}
exports.default = PostgresClient;
