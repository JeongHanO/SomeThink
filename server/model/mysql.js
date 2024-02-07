const dotenv = require("dotenv");
const mysql = require("mysql");
dotenv.config();

class SingletonBase {
    constructor() {
        if (!!SingletonBase.instance) {
            console.log("already has instance");
            console.log("return exising instance");

            return SingletonBase.instance;
        }
    }
}
module.exports = class DatabaseConnector extends SingletonBase {
    constructor() {
        super();
        this.config = {
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
        };
        return this;
    }

    init() {
        this.connection = mysql.createConnection({
            ...this.config,
            multipleStaments: true,
        });

        return new Promise((resolve, reject) => {
            this.connection.connect((err) => {
                if (err) {
                    reject(err.message);
                }
                resolve("complete!");
            });
        });
    }

    terminate() {
        if (!this.connection || this.connection.state === "disconnected") {
            console.log("connot termiate connection of disconnected state");
            return;
        }
        return new Promise((resolve, reject) => {
            this.connection.end((err) => {
                if (err) {
                    reject(err.message);
                }

                delete this.connection;
                resolve("complete!");
            });
        });
    }

    /**
     *
     * @param {Mysql query} sql
     */
    query(sql) {
        this.connection.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    }
};
