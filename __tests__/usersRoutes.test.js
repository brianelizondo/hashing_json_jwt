const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = require("../app");
const db = require("../db");
const { SECRET_KEY } = require("../config");
const User = require("../models/user");

const BCRYPT_WORK_FACTOR = 1;

const testUser = {
    username: "test1",
    password: "password",
    first_name: "Test1",
    last_name: "Testy1",
    phone: "+14155550000"
}
let testUserToken;

beforeAll(async function(){
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    const hashedPassword = await bcrypt.hash(testUser.password, BCRYPT_WORK_FACTOR);
    await User.register(testUser.username, hashedPassword, testUser.first_name, testUser.last_name, testUser.phone);
    testUserToken = jwt.sign({ username: testUser.username }, SECRET_KEY);
});

/** Test all Users Routes APP */
describe("Users Routes Test", function (){
    /** GET /users  */
    describe("GET /users", function (){
        test("get list of users", async function (){
            let response = await request(app)
                .get("/users")
                .send({ _token: testUserToken });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ 
                users: expect.any(Array) 
            });
        });

        test("check if user is authenticated or correct username", async function (){
            let response = await request(app).get("/users");
            expect(response.statusCode).toEqual(401);
        });
    });

    /** GET /users/:username  */
    describe("GET /users/:username", function (){
        test("get details of an user", async function (){
            let response = await request(app)
                .get(`/users/${testUser.username}`)
                .send({
                    username: testUser.username,
                    _token: testUserToken
                });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ 
                user: expect.any(Object) 
            });
        });

        test("error to get details of an invalid user", async function (){
            let response = await request(app)
                .get("/users/invalidUser")
                .send({
                    username: "abc",
                    _token: testUserToken
                });

            expect(response.statusCode).toEqual(401);
        });

        test("check if user is authenticated or correct username", async function (){
            let response = await request(app).get(`/users/${testUser.username}`);
            expect(response.statusCode).toEqual(401);
        });
    });

    /** GET /users/:username/to  */
    describe("GET /users/:username/to", function (){
        test("get details of messages to user", async function (){
            let response = await request(app)
                .get(`/users/${testUser.username}/to`)
                .send({ _token: testUserToken });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ 
                messages: expect.any(Array) 
            });
        });

        test("error to get details of messages from an invalid user", async function (){
            let response = await request(app)
                .get("/users/invalidUser/to")
                .send({ _token: testUserToken });

            expect(response.statusCode).toEqual(401);
        });

        test("check if user is authenticated or correct username", async function (){
            let response = await request(app).get(`/users/${testUser.username}/to`);
            expect(response.statusCode).toEqual(401);
        });
    });

    /** GET /users/:username/from  */
    describe("GET /users/:username/from", function (){
        test("get details of messages from user", async function (){
            let response = await request(app)
                .get(`/users/${testUser.username}/from`)
                .send({ _token: testUserToken });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ 
                messages: expect.any(Array) 
            });
        });

        test("error to get details of messages from an invalid user", async function (){
            let response = await request(app)
                .get("/users/invalidUser/from")
                .send({ _token: testUserToken });

            expect(response.statusCode).toEqual(401);
        });

        test("check if user is authenticated or correct username", async function (){
            let response = await request(app).get(`/users/${testUser.username}/from`);
            expect(response.statusCode).toEqual(401);
        });
    });
});  

afterAll(async function (){
  await db.end();
});
