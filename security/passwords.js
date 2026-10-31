'use strict';
const Users = require('../models/user.model');
const validation = require('./validation');
async function change(actor, targetId, body) {
    body = validation.passwordBody(body);
    if (!actor) { const error = new Error('Authentication required'); error.status = 401; throw error; }
    const own = String(actor.id || actor._id) === String(targetId);
    const admin = Array.isArray(actor.roles) && actor.roles.includes('admin');
    if (!own && !admin) { const error = new Error('Forbidden'); error.status = 403; throw error; }
    const user = await Users.findById(validation.id(String(targetId)));
    if (!user) { const error = new Error('USER_NOT_FOUND'); error.status = 404; throw error; }
    validation.password(body.password);
    if (body.passwordVerify !== undefined && body.password !== body.passwordVerify) throw validation.invalid('Password does not match');
    if (!admin && !user.validPassword(body.oldPassword)) { const error = new Error('Old password is not valid'); error.status = 403; throw error; }
    await user.setPassword(body.password);
    await user.save();
    return user;
}
module.exports = {change};

