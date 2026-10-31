'use strict';
const Permission = require('../models/permission.model');
const jwt = require('./auth.jwt');
function ensureUser(req, res, next) {
    if (req.user) return next();
    if (jwt.headerToken(req) || (req.method === 'GET' && req.query.token)) return jwt.verifyToken(req, res, next);
    return res.status(401).send({message: res.__('ERR004')});
}
function validateRole(req, res, next, roles) {
    if (!req.user && !req.originalUrl?.startsWith('/api/') && !jwt.headerToken(req)) return res.redirect('/login?url=' + encodeURIComponent(req.originalUrl));
    return ensureUser(req, res, () => {
        const allowed = [...(Array.isArray(roles) ? roles : [roles]), 'admin'];
        if (Array.isArray(req.user.roles) && req.user.roles.some(role => allowed.includes(role))) return next();
        return res.status(403).send({message: res.__('ERR005')});
    });
}
exports.isAdmin = (req, res, next) => validateRole(req, res, next, 'admin');
exports.isRole = role => (req, res, next) => validateRole(req, res, next, role);
// Preserve misspelled public name used by all four consumers.
exports.checkPermision = (entity, access) => (req, res, next) => ensureUser(req, res, () => {
    if (!Array.isArray(req.user.roles)) return res.status(403).send({message: res.__('ERR005')});
    if (req.user.roles.includes('admin')) return next();
    return Promise.resolve().then(() => Permission.find({entity, roles: {$in: req.user.roles}, $expr: {$in: [access, '$type']}}))
        .then(items => items.length ? next() : res.status(403).send({message: res.__('ERR005')})).catch(next);
});
exports.getPermissionsForEntity = async (entity, user) => {
    if (!user || !Array.isArray(user.roles)) return [];
    if (user.roles.includes('admin')) return ['C', 'R', 'U', 'D'];
    const items = await Permission.find({entity: entity.toLowerCase(), roles: {$in: user.roles}});
    return [...new Set(items.flatMap(item => item.type))];
};
