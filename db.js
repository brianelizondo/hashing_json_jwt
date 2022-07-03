/** Database connection for messagely. */


const { Client } = require("pg");
const { DB_URI } = require("./config");

const client = new Client({
    user: 'brian',
    password: '123456',
    database: DB_URI
  });

client.connect();


module.exports = client;
