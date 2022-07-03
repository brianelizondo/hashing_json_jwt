/** User class for message.ly */

const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

const db = require("../db");
const ExpressError = require("../expressError");
const Message = require("./message");

/** User of the site. */

class User {
    constructor({ username, first_name, last_name, phone, join_at, last_login_at }) {
        this.username = username;
        this.first_name = first_name;
        this.last_name = last_name;
        this.phone = phone;
        this.join_at = new Date(join_at);
        this.last_login_at = last_login_at !== null ? new Date(last_login_at) : null;
    }
    /** 
    * Register new user
    *   Returns {username, password, first_name, last_name, phone}
    */
    static async register({username, password, first_name, last_name, phone}){ 
        const result_user = await db.query(
            `SELECT 
                username 
            FROM users 
            WHERE username = $1`, 
        [username]);
        if(result_user.rows[0]){
            throw new ExpressError(`The username is already taken`, 400);
        }
        
        const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
        const result = await db.query(
            `INSERT INTO users (
                username,
                password,
                first_name,
                last_name,
                phone, 
                join_at)
            VALUES ($1, $2, $3, $4, $5, current_timestamp) 
            RETURNING username, password, first_name, last_name, phone`,
        [username, hashedPassword, first_name, last_name, phone]);
    
        return result.rows[0];
    }

    /** 
    * Authenticate: is this username/password valid? 
    *   Returns boolean. 
    */
    static async authenticate(username, password){ 
        const result = await db.query(
            `SELECT username, password FROM users WHERE username = $1`,
            [username]);
        const user = result.rows[0];
      
        if(user){
            if(await bcrypt.compare(password, user.password)){
                return true;
            } 
        }
        return false;
    }

    /**
    * Update last_login_at for user 
    */
    static async updateLoginTimestamp(username){ 
        const result = await db.query(
            `SELECT username FROM users WHERE username = $1`,
            [username]);
        const user = result.rows[0];
      
        if(user){
            const result = await db.query(
                `UPDATE users 
                SET last_login_at = current_timestamp
                WHERE username = $1`,
            [user.username]);
        }
    }

    /** 
    * All: basic info on all users:
    *   [{username, first_name, last_name, phone}, ...] 
    */
    static async all(){ 
        const result = await db.query(
            `SELECT 
                username, first_name, last_name, phone, join_at, last_login_at  
            FROM users 
            ORDER BY first_name, last_name`
        );
        const users = result.rows;
        let all_users = [];
        for(let user of users){
            const new_user = new User(user);
            all_users.push({ 
                username: new_user.username, 
                first_name: new_user.first_name, 
                last_name: new_user.last_name, 
                phone: new_user.phone
            });
        }
        
        return all_users;
    }

    /** 
    * Get: get user by username
    *   Returns {username, first_name, last_name, phone, join_at, last_login_at } 
    */
    static async get(username){ 
        const result = await db.query(
            `SELECT 
                username, first_name, last_name, phone, join_at, last_login_at 
            FROM users 
            WHERE username = $1`, 
        [username]);
        const user = result.rows[0];
        
        if(!user){
            throw new ExpressError(`No such username: ${username}`, 404);
        }
        
        return new User(user);
    }

    /** 
    * Return messages from this user. 
    *   [{id, to_user, body, sent_at, read_at}]
    *
    * Where to_user is
    *   {username, first_name, last_name, phone}
    */
    static async messagesFrom(username){
        const result_user = await db.query(
            `SELECT 
                username, first_name, last_name, phone 
            FROM users 
            WHERE username = $1`, 
        [username]);
        
        if(!result_user.rows[0]){
            throw new ExpressError(`No such username: ${username}`, 404);
        }

        const user = new User(result_user.rows[0]);
        const result = await db.query(
            `SELECT 
                id, to_user, body, sent_at, read_at 
            FROM messages 
            WHERE from_username = $1`, 
        [user]);

        return result.rows[0];
    }

    /** 
    * Return messages to this user.
    *   [{id, from_user, body, sent_at, read_at}]
    *
    * Where from_user is
    *   {username, first_name, last_name, phone}
    */
    static async messagesTo(username){ 
        const result_user = await db.query(
            `SELECT 
                username, first_name, last_name, phone 
            FROM users 
            WHERE username = $1`, 
        [username]);
        
        if(!result_user.rows[0]){
            throw new ExpressError(`No such username: ${username}`, 404);
        }

        const user = new User(result_user.rows[0]);
        const result = await db.query(
            `SELECT 
                id, to_user, body, sent_at, read_at 
            FROM messages 
            WHERE to_username = $1`, 
        [user]);

        return result.rows[0];
    }
}


module.exports = User;