const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
dotenv.config();

class SingletonBase {
    constructor() {
        if (!!SingletonBase.instance) {
            console.log("already has instance");
            console.log("return existing instance");

            return SingletonBase.instance;
        }
    }
}

class DatabaseConnector extends SingletonBase {
    constructor() {
        super();
        this.config = {
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
        };
        this.pool = mysql.createPool({
            ...this.config,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 10,
        });
        return this;
    }

    async init() {
        try {
            await this.pool.query("CREATE DATABASE IF NOT EXISTS " + process.env.DATABASE_NAME);
            console.log("Database created or successfully checked");
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS user (
                    user_id int NOT NULL AUTO_INCREMENT,
                    user_email varchar(255),
                    password varchar(255),
                    created_at timestamp,
                    username varchar(255),
                    PRIMARY KEY (user_id)
                )
            `);
            console.log("User table created or successfully checked");
            return "complete!";
        } catch (error) {
            throw error;
        }
    }

    async terminate() {
        try {
            await this.pool.end();
            console.log("Connection pool terminated successfully");
            return "complete!";
        } catch (error) {
            throw error;
        }
    }
    /**
     *
     * @param {DB query} sql
     * @returns colums_data
     */
    async query(sql) {
        try {
            const [rows, fields] = await this.pool.query(sql);
            return rows;
        } catch (error) {
            throw error;
        }
    }
    /**
     *
     * @param {DB query} sql
     * @param {Value_data} param
     * @returns colums_data
     */
    async execute(sql, param) {
        let conn;
        try {
            conn = await this.pool.getConnection();
            await conn.beginTransaction();
            const [rows, fields] = await conn.query(sql, param);
            await conn.commit();
            return rows;
        } catch (error) {
            await conn.rollback();
            console.error("Error executing SQL query:", error);
            throw error;
        } finally {
            if (conn) {
                conn.release();
            }
        }
    }
}

module.exports = new DatabaseConnector();
