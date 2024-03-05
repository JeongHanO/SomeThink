const request = require("supertest");
const app = require("../test_server");
const TEST_SERVER = process.env.TEST_SERVER;
const agent = request(app);
const { sign, verify } = require("jsonwebtoken");
const DatabaseConnector = require("../model/databaseConnector");
// 이후 도입 예정
// const { expect, assert } = require("chai");

const generateRandom_Id = (length) => {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};
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
        });
        it("데이터베이스에 user 테이블 존재해야함", async () => {
            try {
                await DatabaseConnector.query("DESCRIBE user");
            } catch (err) {
                console.log(err);
            }
        });
    });
    describe("CRUD TEST", () => {
        const randomusername = generateRandom_Id(6);
        describe("POST /user/signup/register", () => {
            it("이미 존재하는 회원이면 오류를 발산해야한다", async () => {
                const response = await agent.post(`/user/signup/register`).send({
                    username: "test1",
                    password: "test1",
                    email: "test1@naver.com",
                });
                //message : "Success Login"
                expect(response.status).toEqual(409);
            });
            it("회원가입이 완료되는 지", async () => {
                const response = await agent.post(`/user/signup/register`).send({
                    username: randomusername,
                    password: "test1",
                    email: "test1@naver.com",
                });
                //message : "Success Login"
                expect(response.status).toEqual(201);
                expect(response.body.message).toEqual(`New user ${randomusername} created!`);
            });
        });
        describe("GET /user/signin/login", () => {
            it("로그인시 존재하지 않는 회원이면 잘못된 응답이라고 떠야한다.", async () => {
                const response = await agent.get(
                    `/user/signin/login?username=${randomusername}&password=test1`
                );

                expect(response.status).toEqual(401);
            });
            it("로그인시 아이디 패스워드 입력 확인", async () => {
                const response = await agent.get(
                    `/user/signin/login?username=test1&password=test1`
                );
                expect(response.body.message).toEqual("Success Login");
            });
            it("응답에 전달되는 엑세스 토큰은 유저정보가 담긴 JWT 토큰이어야 한다.", async () => {
                const response = await agent.get(
                    `/user/signin/login?username=test1&password=test1`
                );
                const tokenData = verify(
                    response.body.accessToken,
                    process.env.ACCESS_TOKEN_SECRET
                );
                expect(tokenData.UserInfo.username).toEqual("test1");
            });
            it("로그인 성공시 전달되는 응답에는 refreshToken이 같이 있어야한다.", async () => {
                const response = await agent.get(
                    `/user/signin/login?username=test1&password=test1`
                );
                const refreshTokenCookieExist = response.header["set-cookie"].some((cookie) =>
                    cookie.includes("jwt")
                );
                expect(refreshTokenCookieExist).toEqual(true);
            });
        });
        describe("GET /user/signin/refreshToken", () => {
            it("쿠키에 리프레쉬 토큰이 없는 경우 오류를 내야한다.", async () => {
                const response = await agent.get(`/user/signin/refreshToken`);
                expect(response.statusCode).toEqual(401);
            });
            it("쿠키에 리프레쉬 유효하지 않은 토큰인 경우 오류를 내야한다.", async () => {
                const response = await agent
                    .get(`/user/signin/refreshToken`)
                    .set("Cookie", `jwt=invalidtoken`);
                expect(response.body.data).toEqual(null);
                expect(response.body.message).toEqual("invalid");
            });
            // FIXME: 비동기적 움직임 때문에 테스트 Extra 디비에 넣기전에 요청을 먼저 해버림.....
            // it("유효한 리프레쉬 토큰을 전달받은 경우", async () => {
            //     const refreshToken = sign(
            //         {
            //             username: "test1",
            //         },
            //         process.env.REFRESH_TOKEN_SECRET,
            //         { expiresIn: "1d" }
            //     );
            //     const response = await agent
            //         .get(`/user/signin/refreshToken`)
            //         .set("Cookie", `jwt=${refreshToken}`);
            //     expect(response.statusCode).toEqual(200);
            // });
        });
    });
});
