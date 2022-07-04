const express = require("express");
const ExpressError = require("../expressError");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const jwt = require("jsonwebtoken");

const Message = require("../models/message");

const router = new express.Router();

/** 
* GET /:id - get detail of message.
*   => {message: {id,
*               body,
*               sent_at,
*               read_at,
*               from_user: {username, first_name, last_name, phone},
*               to_user: {username, first_name, last_name, phone}}
*
*   Make sure that the currently-logged-in users is either the to or from user.
**/
router.get("/:id", ensureLoggedIn, async function(req, res, next) {
    try {
        const message = await Message.get(req.params.id);

        const payload = jwt.decode(req.body._token);
        if(payload.username == message.from_user.username || payload.username == message.to_user.username){
            return res.json({ message: message });
        }
        throw new ExpressError("Unauthorized", 401);
    } catch (err) {
        return next(err);
    }
});

/** 
* POST / - post message.
*   {to_username, body} =>
*       {message: {id, from_username, to_username, body, sent_at}}
**/
router.post("/", ensureLoggedIn, async function(req, res, next) {
    try {
        const to_username = req.body.to_username;
        const body = req.body.body;
        if(!to_username || !body){
            throw new ExpressError("All fields are required", 400);
        }

        const payload = jwt.decode(req.body._token);
        const message = await Message.create(payload.username, to_username, body);
        return res.json({ message: message });
    } catch (err) {
        return next(err);
    }
});

/** 
* POST/:id/read - mark message as read:
*   => {message: {id, read_at}}
*
*   Make sure that the only the intended recipient can mark as read.
**/
router.post("/:id/read", ensureLoggedIn, async function(req, res, next) {
    try {
        const message = await Message.get(req.params.id);
        const payload = jwt.decode(req.body._token);
        if(payload.username == message.to_user.username){
            const message_read = await Message.markRead(req.params.id);
            return res.json({ message: message_read });
        }
        throw new ExpressError("Unauthorized", 401);
    } catch (err) {
        return next(err);
    }
});

module.exports = router;