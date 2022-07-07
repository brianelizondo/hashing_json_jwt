const express = require("express");
const ExpressError = require("../expressError");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");

const User = require("../models/user");

const router = new express.Router();

/** 
* GET / - get list of users.
*   => {users: [{username, first_name, last_name, phone}, ...]}
**/
router.get("/", ensureLoggedIn, async function(req, res, next) {
    try {
        const users = await User.all();
        return res.json({ users: users });
    } catch (err) {
        return next(err);
    }
});

/** 
* GET /:username - get detail of users.
*   => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
**/
router.get("/:username", ensureCorrectUser, async function(req, res, next) {
    try {
        const user = await User.get(req.params.username);
        const users_all = await User.all();
        const messages_to = await User.messagesTo(req.params.username);
        const messages_from = await User.messagesFrom(req.params.username); 
        // return res.json({ user: user });
        res.render("users_details.html", { user, users_all, messages_to, messages_from });
    } catch (err) {
        return next(err);
    }
});

/** 
* GET /:username/to - get messages to user
*   => {messages: [{id,
*                 body,
*                 sent_at,
*                 read_at,
*                 from_user: {username, first_name, last_name, phone}}, ...]}
**/
router.get("/:username/to", ensureCorrectUser, async function(req, res, next) {
    try {
        const messages_to = await User.messagesTo(req.params.username);
        return res.json({ messages: messages_to });
    } catch (err) {
        return next(err);
    }
});

/** 
* GET /:username/from - get messages from user
*   => {messages: [{id,
*                 body,
*                 sent_at,
*                 read_at,
*                 to_user: {username, first_name, last_name, phone}}, ...]}
**/
router.get("/:username/from", ensureCorrectUser, async function(req, res, next) {
    try {
        const messages_from = await User.messagesFrom(req.params.username);
        return res.json({ messages: messages_from });
    } catch (err) {
        return next(err);
    }
});

 module.exports = router;