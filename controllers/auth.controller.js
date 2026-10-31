'use strict';
const config = require('../config/config');
const Users = require('../models/user.model');
const jwt = require('../middlewares/auth.jwt');
const Email = require('../config/email.config');
const tokens = require('../security/account-tokens');
const passwords = require('../security/passwords');
const validation = require('../security/validation');
function fail(err, req, res, next) {
    if (err.name === 'ValidationError' || err.name === 'CastError') err.status = 400;
    if (err.status && err.status < 500) return res.status(err.status).send({message: res.__(err.message)});
    return next(err);
}
function passwordInput(req) { return validation.passwordBody({...req.body, ...(req.newPassword !== undefined ? {newPassword: req.newPassword} : {})}); }
function recipient(user) { return config.config.app.ENV === 'development' ? config.getConfig('ADMIN_EMAIL') : user.email; }
function baseUrl(req) {
    const configured = process.env.PUBLIC_ORIGIN || config.getConfig('PUBLIC_ORIGIN');
    if (!configured && config.config.app.ENV === 'production') throw new Error('PUBLIC_ORIGIN is required for account emails');
    const url = new URL(configured || req.protocol + '://' + req.get('host'));
    if (!['http:', 'https:'].includes(url.protocol) || (config.config.app.ENV === 'production' && url.protocol !== 'https:')) throw new Error('Invalid PUBLIC_ORIGIN');
    return url.origin;
}
async function link(user, purpose, req) { const base = baseUrl(req); return base + '/complete-registry/' + await tokens.issue(user, purpose); }
async function notifyAdmin(user) { await Email.sendTemplatedEmail('new-registration', config.getConfig('ADMIN_EMAIL'), {user}); }
function newAccount(body, active) {
    return new Users({username: validation.text(body.username, 'username', 128), email: validation.email(body.email), roles: ['user'], active});
}
async function login(req, user, res, next) {
    req.login(user, err => {
        if (err) return next(err);
        req.session.authPasswordVersion = user.passwordVersion || 0;
        req.session.save(err => err ? next(err) : res.redirect(validation.safeRedirect(req.query.url || req.body.url)));
    });
}
exports.register = async (req, res, next) => {
    const twoSteps = config.getFeature('TWO_STEPS_REGISTRY');
    try {
        if (req.error) return res.status(400).render('register', {layout: false, twoSteps, username: req.body.username, email: req.body.email, error: req.error});
        const user = newAccount(req.body, !twoSteps);
        if (!twoSteps) await user.setPassword(validation.password(passwordInput(req).password));
        await user.save();
        const destination = twoSteps ? await link(user, 'registration', req) : baseUrl(req) + '/login';
        await Email.sendTemplatedEmail(twoSteps ? 'registration-twosteps' : 'registration-completed', recipient(user), {user, link: destination});
        await notifyAdmin(user);
        res.redirect('/login?' + (twoSteps ? 'registerPending' : 'registerSucceed'));
    } catch (err) { fail(err, req, res, next); }
};
exports.completeRegistration = async (req, res, next) => {
    const token = req.params.token || req.body.token;
    try {
        if (req.error) return res.status(400).render('complete-registry', {layout: false, token, error: req.error});
        const input = passwordInput(req);
        if (input.passwordVerify !== undefined && input.password !== input.passwordVerify) throw validation.invalid('Password does not match');
        const user = await tokens.consume(token, input.password);
        if (!user) return res.redirect('/login?errorNotUser');
        return login(req, user, res, next);
    } catch (err) { fail(err, req, res, next); }
};
exports.register2 = async (req, res, next) => {
    try {
        if (req.error) { req.error.status = req.error.status || 400; throw req.error; }
        const user = newAccount(req.body, false);
        await user.save();
        await Email.sendTemplatedEmail('registration', recipient(user), {user, link: await link(user, 'registration', req)});
        await notifyAdmin(user);
        res.send({message: 'OK'});
    } catch (err) { fail(err, req, res, next); }
};
exports.resetPass = async (req, res, next) => {
    try {
        const user = await Users.findOne({email: validation.email(req.body.email), active: true});
        if (user) await Email.sendTemplatedEmail('password-reset', recipient(user), {user, link: await link(user, 'reset', req)});
        res.send({message: res.__('Email sent with link to reset password')});
    } catch (err) { fail(err, req, res, next); }
};
// Existing API signup remains pending administrator approval; no client-supplied roles.
exports.signup = async (req, res, next) => {
    try {
        if (req.error) { req.error.status = req.error.status || 400; throw req.error; }
        const user = newAccount(req.body, false);
        await user.setPassword(validation.password(passwordInput(req).password));
        await user.save();
        await Email.sendTemplatedEmail('registration-confirmation', recipient(user), {user, link: baseUrl(req)});
        await notifyAdmin(user);
        res.send({message: 'OK'});
    } catch (err) { fail(err, req, res, next); }
};
exports.setPassword = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).send({message: res.__('ERR004')});
        if (!req.user.roles.includes('admin')) return res.status(403).send({message: res.__('ERR005')});
        await passwords.change(req.user, req.params.id, req.body);
        res.send({message: 'OK'});
    } catch (err) { fail(err, req, res, next); }
};
exports.changepassword = async (req, res, next) => {
    try {
        if (req.error) return res.status(400).send({message: req.error.message});
        const user = await passwords.change(req.user, req.params.id, req.body);
        if (req.session && String(user.id) === String(req.user.id)) req.session.authPasswordVersion = user.passwordVersion || 0;
        res.send({message: 'OK'});
    } catch (err) { fail(err, req, res, next); }
};
exports.signin = async (req, res, next) => {
    try {
        const username = validation.text(req.body.username, 'username', 128);
        const password = validation.password(passwordInput(req).password);
        const user = await Users.findOne({username, active: true});
        if (!user || !user.validPassword(password)) return res.status(401).send({accessToken: null, message: res.__('ERR002')});
        user.lastLogin = new Date();
        await user.save();
        res.send({id: user._id, username: user.username, email: user.email, roles: user.roles.filter(role => typeof role === 'string').map(role => 'ROLE_' + role.toUpperCase()), accessToken: jwt.generateToken(user)});
    } catch (err) { fail(err, req, res, next); }
};
