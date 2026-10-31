'use strict';
const Users = require('../models/user.model');
const config = require('../config/config');
const validation = require('../security/validation');
function reject(req, error) { error.status = error.status || 400; req.error = error; }
exports.checkInputData = (req, res, next) => {
    try { validation.text(req.body.username, 'username', 128); validation.email(req.body.email); } catch (err) { reject(req, err); }
    return next();
};
exports.checkDuplicateUsernameOrEmail = async (req, res, next) => {
    if (req.error) return next();
    try {
        if (await Users.findOne({username: req.body.username.trim()})) reject(req, new Error(res.__('Failed! Username is already in use!')));
        else if (await Users.findOne({email: req.body.email.trim()})) reject(req, new Error(res.__('Failed! Email is already in use!')));
        return next();
    } catch (err) { return next(err); }
};
exports.validateNewPassword = async (req, res, next) => {
    if (req.error) return next();
    try {
        const input = validation.passwordBody(req.body);
        validation.password(input.password);
        if (input.passwordVerify !== undefined && input.password !== input.passwordVerify) throw validation.invalid(res.__('Password does not match'));
        const pattern = await config.getConfig('PASSWORD_COMPLEXITY');
        if (pattern && !new RegExp(pattern).test(input.password)) throw validation.invalid(res.__('Password does not match complexity'));
        req.newPassword = input.password;
        // Old-password and identity checks belong to passwords.change, not to public reset/registration.
        return next();
    } catch (err) { reject(req, err); return next(); }
};
