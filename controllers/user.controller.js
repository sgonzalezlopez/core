'use strict';
const Users = require('../models/user.model');
const validation = require('../security/validation');
const projection = '-salt -hash -actionTokenHash -actionTokenPurpose -actionTokenExpiresAt';
function handler(action) { return async (req, res, next) => { try { await action(req, res); } catch (err) { if (err.status === 400 || err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).send({message: err.message}); next(err); } }; }
function publicUser(user) { const value = user.toObject ? user.toObject() : {...user}; for (const key of ['salt', 'hash', 'actionTokenHash', 'actionTokenPurpose', 'actionTokenExpiresAt']) delete value[key]; return value; }
exports.getAll = handler(async (_req, res) => res.send(await Users.find().select(projection)));
exports.get = handler(async (req, res) => {
    const user = await Users.findById(validation.id(req.params.id)).select(projection);
    return user ? res.send(user) : res.status(404).send({message: res.__('ITEM_NOT_FOUND')});
});
exports.create = handler(async (req, res) => {
    const user = new Users({username: validation.text(req.body.username, 'username', 128), email: validation.email(req.body.email), roles: req.body.roles === undefined ? ['user'] : validation.roles(req.body.roles), active: req.body.active === undefined || req.body.active === '' ? false : validation.boolean(req.body.active)});
    if (req.body.password !== undefined && req.body.password !== '') await user.setPassword(validation.password(req.body.password));
    await user.save();
    res.send(publicUser(user));
});
exports.updateProfile = handler(async (req, res) => {
    if (!req.user) return res.status(401).send({message: res.__('ERR004')});
    if (String(req.user.id || req.user._id) !== req.params.id) return res.status(403).send({message: res.__('INVALID_OPERATION')});
    const user = await Users.findById(validation.id(req.params.id));
    if (!user) return res.status(404).send({message: res.__('ITEM_NOT_FOUND')});
    if (req.body.email !== undefined) user.email = validation.email(req.body.email);
    await user.save();
    res.send(publicUser(user));
});
exports.update = handler(async (req, res) => {
    const user = await Users.findById(validation.id(req.params.id));
    if (!user) return res.status(404).send({message: res.__('ITEM_NOT_FOUND')});
    if (req.body.email !== undefined) user.email = validation.email(req.body.email);
    if (req.body.active !== undefined && req.body.active !== '') user.active = validation.boolean(req.body.active);
    if (req.body.roles !== undefined) user.roles = validation.roles(req.body.roles);
    await user.save();
    res.send(publicUser(user));
});
exports.delete = handler(async (req, res) => { await Users.deleteOne({_id: validation.id(req.params.id)}); res.send({message: 'OK'}); });
exports.find = handler(async (req, res) => res.send(await Users.find(validation.userFilters(req.body)).select(projection)));
