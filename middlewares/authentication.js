'use strict';
const authJwt = require('./auth.jwt');
function authenticated(req) { return !!req.user && (req.authenticationSource || (typeof req.isAuthenticated === 'function' && req.isAuthenticated())); }
exports.isAuthenticated = (req, res, next) => {
    if (authenticated(req)) return next();
    if (authJwt.headerToken(req) || (req.method === 'GET' && req.query.token)) return authJwt.verifyToken(req, res, next);
    return res.status(401).send({message: res.__('ERR004')});
};
exports.isAuthenticatedWeb = (req, res, next) => {
    if (authenticated(req)) return next();
    if (authJwt.headerToken(req) || (req.method === 'GET' && req.query.token)) return authJwt.verifyToken(req, res, next);
    return res.redirect('/login?url=' + encodeURIComponent(req.originalUrl));
};
