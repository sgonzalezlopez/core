'use strict';
const jwt = require('jsonwebtoken');
const {config} = require('../config/config');
const Users = require('../models/user.model');
const {safeRedirect} = require('../security/validation');
function headerToken(req) {
    const bearer = req.headers.authorization;
    return req.headers['x-access-token'] || (typeof bearer === 'string' && /^Bearer /i.test(bearer) ? bearer.slice(7) : undefined);
}
function verifyToken(req, res, next) {
    const token = headerToken(req) || (req.method === 'GET' ? req.query.token : (req.path === '/token-login' ? req.body.token : undefined));
    if (typeof token !== 'string' || token.length > 8192) return res.status(401).send({message: res.__('ERR003')});
    jwt.verify(token, config.auth.JWT_SECRET, {algorithms: ['HS256']}, (err, decoded) => {
        if (err || !decoded || typeof decoded.id !== 'string') return res.status(401).send({message: res.__('ERR003')});
        Promise.resolve().then(() => Users.findOne({_id: decoded.id, active: true})).then(user => {
            if (!user || (decoded.passwordVersion || 0) !== (user.passwordVersion || 0)) return res.status(401).send({message: res.__('ERR003')});
            req.userId = user.id;
            req.user = user;
            req.authenticationSource = headerToken(req) ? 'token' : 'query-token';
            return next();
        }).catch(next);
    });
}
function validateToken(req, res, next) {
    if (headerToken(req)) return verifyToken(req, res, next);
    if (req.method !== 'GET' || !req.query.token) return next();
    return verifyToken(req, res, next);
}
function confirmLogin(req, res, next) {
    return verifyToken(req, res, () => req.login(req.user, err => {
        if (err) return next(err);
        req.session.authPasswordVersion = req.user.passwordVersion || 0;
        req.session.save(err => err ? next(err) : res.redirect(safeRedirect(req.body.url)));
    }));
}

function generateToken(user) {
    return jwt.sign({id: String(user.id || user._id), username: user.username, roles: user.roles, passwordVersion: user.passwordVersion || 0}, config.auth.JWT_SECRET, {expiresIn: 86400, algorithm: 'HS256'});
}
module.exports = {verifyToken, validateToken, generateToken, headerToken, confirmLogin};
