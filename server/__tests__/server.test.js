const app = require("../routes/api/user/login");
const request = require("supertest");
const agent = request(app);
const { sign, verify } = require("jsonwebtoken");
const DatabaseConnector = require("../model/databaseConnector");
// const { expect, assert } = require("chai");
const https = require("https");

describe("Server_test", () => {
    beforeAll(async () => {
        await DatabaseConnector.init();
    });
    afterAll(async () => {
        await DatabaseConnector.terminate();
    });
    describe("Checking Database Connection", () => {
        it("데이터베이스와 연결이 가능한지", async () => {
            let conn;
            try {
                conn = await DatabaseConnector.init();
            } catch (err) {
                console.log(err);
            }
            // assert.strictEqual(conn, "ok");
        });
        it("데이터베이스에 user 테이블 존재해야함", async () => {
            try {
                await DatabaseConnector.query("DESCRIBE user");
            } catch (err) {
                console.log(err);
            }
        });
    });
    // describe("CRUD TEST", () => {
    //     describe("POST /user/signup", () => {
    //         it("회원가입 요청시 전달받은 유저아이디 비번 이메일을 입력할 수 있어야합니다.", async () => {
    //             const response = await (
    //                 await agent.post("/signup/register")
    //             ).body({
    //                 username: "kim",
    //                 password: "1234",
    //                 email: "kim@naver.com",
    //             });
    //             //message : "Success Login"
    //             expect(1).to.eql(1);
    //         });
    //     });
    // });
});
