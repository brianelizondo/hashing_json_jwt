const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = require("../app");
const db = require("../db");
const { SECRET_KEY } = require("../config");
const User = require("../models/user");
const Message = require("../models/message");

const BCRYPT_WORK_FACTOR = 1;

let testUser1;
let testUser2;
let testUser1Token;

let testMessage1;
let testMessage2;
let testMessage3;

beforeAll(async function(){
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    testUser1 = {
        username: "test1",
        password: "password",
        first_name: "Test1",
        last_name: "Testy1",
        phone: "+14155550000"
    }
    testUser2 = {
        username: "test2",
        password: "password",
        first_name: "Test2",
        last_name: "Testy2",
        phone: "+14155550000"
    }
    let testUser3 = {
        username: "test3",
        password: "password",
        first_name: "Test3",
        last_name: "Testy3",
        phone: "+14155550000"
    }

    const hashedPassword1 = await bcrypt.hash(testUser1.password, BCRYPT_WORK_FACTOR);
    const hashedPassword2 = await bcrypt.hash(testUser2.password, BCRYPT_WORK_FACTOR);
    const hashedPassword3 = await bcrypt.hash(testUser3.password, BCRYPT_WORK_FACTOR);
    await User.register(testUser1.username, hashedPassword1, testUser1.first_name, testUser1.last_name, testUser1.phone);
    await User.register(testUser2.username, hashedPassword2, testUser2.first_name, testUser2.last_name, testUser2.phone);
    await User.register(testUser3.username, hashedPassword3, testUser3.first_name, testUser3.last_name, testUser3.phone);
    testUser1Token = jwt.sign({ username: testUser1.username }, SECRET_KEY);

    testMessage1 = {
        from_username: "test1",
        to_username: "test2",
        body: "message from test1 user to the test2 user"
    }
    testMessage2 = {
        from_username: "test2",
        to_username: "test1",
        body: "message from test2 user to the test1 user"
    }
    testMessage3 = {
        from_username: "test2",
        to_username: "test3",
        body: "message from test2 user to the test3 user"
    }
    const response_1 = await Message.create(testMessage1.from_username, testMessage1.to_username, testMessage1.body);
    testMessage1.id = response_1.id;
    const response_2 = await Message.create(testMessage2.from_username, testMessage2.to_username, testMessage2.body);
    testMessage2.id = response_2.id;
    const response_3 = await Message.create(testMessage3.from_username, testMessage3.to_username, testMessage3.body);
    testMessage3.id = response_3.id;
});

/** Test all Messages Routes APP */
describe("Messages Routes Test", function (){
    /** GET /messages/:id  */
    describe("GET /messages/:id", function (){
        test("get details of a message", async function (){
            let response = await request(app)
                .get(`/messages/${testMessage1.id}`)
                .send({ _token: testUser1Token });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ 
                message: {
                    id: expect.any(Number),
                    from_user: expect.any(Object),
                    to_user: expect.any(Object),
                    body: expect.any(String),
                    sent_at: expect.any(String),
                    read_at: null
                }
            });
        });

        test("error to get details of an invalid message", async function (){
            let response = await request(app)
                .get(`/messages/${testMessage3.id}`)
                .send({ _token: testUser1Token });

            expect(response.statusCode).toEqual(401);
        });

        test("check if user is authenticated or correct username", async function (){
            let response = await request(app).get(`/messages/${testMessage1.id}`);
            expect(response.statusCode).toEqual(401);
        });
    });

    /** POST /messages  */
    describe("POST /messages", function (){
        test("post to create a new message", async function (){
            let response = await request(app)
                .post("/messages")
                .send({ 
                    from_username: testUser1.username,
                    to_username: testUser2.username,
                    body: `new test message from ${testUser1.username} user to the ${testUser2.username} user`,
                    _token: testUser1Token 
                });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ 
                message: {
                    id: expect.any(Number), 
                    from_username: testUser1.username, 
                    to_username: testUser2.username, 
                    body: expect.any(String), 
                    sent_at: expect.any(String)
                }
            });
        });

        test("check if user is authenticated or correct username", async function (){
            let response = await request(app).get(`/messages/${testMessage1.id}`);
            expect(response.statusCode).toEqual(401);
        });
    });

    /** POST /messages/:id/read  */
    describe("POST /messages/:id/read", function (){
        test("post to mark read a message", async function (){
            let response = await request(app)
                .post(`/messages/${testMessage2.id}/read`)
                .send({ _token: testUser1Token });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ 
                message: {
                    id: testMessage2.id, 
                    read_at: expect.any(String)
                }
            });
        });

        test("error to to mark read of an invalid message", async function (){
            let response = await request(app)
                .get(`/messages/${testMessage3.id}`)
                .send({ _token: testUser1Token });

            expect(response.statusCode).toEqual(401);
        });

        test("check if user is authenticated or correct username", async function (){
            let response = await request(app).get(`/messages/${testMessage1.id}`);
            expect(response.statusCode).toEqual(401);
        });
    });
});

afterAll(async function (){
    await db.end();
});