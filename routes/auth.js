const express = require("express");
const jwt = require("jsonwebtoken");
const ExpressError = require("../expressError");
const { SECRET_KEY } = require("../config");

const User = require("../models/user");

const router = new express.Router();

/*
* GET /register - form to login user
*/
router.get("/login", function(req, res) {
    res.render("login.html");
});

/** 
* POST /login - login: {username, password} => {token}
*   Make sure to update their last-login!
**/
router.post("/login", async function(req, res, next) {
    try {
        const { username, password } = req.body;
        if(!username || !password){
            throw new ExpressError("Username/password are required", 400);
        }

        if(await User.authenticate(username, password)){
            await User.updateLoginTimestamp(username);
            let token = jwt.sign({ username }, SECRET_KEY);
            // return res.json({ token });
            res.cookie('message.ly', token, { httpOnly: true, secure: true })
            return res.redirect(`/users/${username}`);
        }
        throw new ExpressError("Invalid username/password", 400);
    } catch (err) {
        return next(err);
    }
});

/*
* GET /logout - logout user
*/
router.get("/logout", function(req, res) {
    if(req.cookies['message.ly']){
        res.clearCookie('message.ly');
    }
    return res.redirect("/");
});

/*
* GET /register - form to register new user
*/
router.get("/register", function(req, res) {
    res.render("register.html");
});

/*
* POST /register - register user: registers, logs in, and returns token.
*   {username, password, first_name, last_name, phone} => {token}.
*
*   Make sure to update their last-login!
*/
router.post("/register", async function(req, res, next) {
    try {
        const { username, password, first_name, last_name, phone } = req.body;
        if(!username || !password || !first_name || !last_name || !phone){
            throw new ExpressError("All fields are required", 400);
        }

        let new_user = await User.register(username, password, first_name, last_name, phone);
        if(new_user !== undefined){
            await User.updateLoginTimestamp(new_user.username);
            let token = jwt.sign({ username: new_user.username }, SECRET_KEY);
            return res.json({ token });
        }

    } catch (err) {
        return next(err);
    }
});

module.exports = router;