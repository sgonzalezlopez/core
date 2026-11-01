'use strict';
const crypto = require('node:crypto');
const Users = require('../models/user.model');
const {password} = require('./validation');
const TTL = Object.freeze({registration: 24 * 60 * 60 * 1000, reset: 30 * 60 * 1000});
const digest = token => crypto.createHash('sha256').update(token).digest('hex');
function tokenQuery(token, purpose) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || !Object.hasOwn(TTL, purpose)) return null;
    return {actionTokenHash: digest(token), actionTokenPurpose: purpose, actionTokenExpiresAt: {$gt: new Date()}, active: purpose === 'reset'};
}
async function issue(user, purpose) {
    if (!Object.hasOwn(TTL, purpose)) throw new Error('Invalid token purpose');
    const token = crypto.randomBytes(32).toString('hex');
    const result = await Users.findOneAndUpdate({_id: user._id, active: purpose === 'reset'}, {$set: {
        actionTokenHash: digest(token), actionTokenPurpose: purpose, actionTokenExpiresAt: new Date(Date.now() + TTL[purpose])
    }}, {returnDocument: 'after', runValidators: true});
    if (!result) throw new Error('Account state changed');
    return token;
}
async function find(token) {
    for (const purpose of Object.keys(TTL)) {
        const query = tokenQuery(token, purpose);
        if (!query) return null;
        const user = await Users.findOne(query);
        if (user) return {user, purpose};
    }
    return null;
}
async function consume(token, newPassword) {
    password(newPassword);
    const match = await find(token);
    if (!match) return null;
    const {user, purpose} = match;
    const previousSalt = user.salt;
    await user.setPassword(newPassword);
    // Compare and consume in the same MongoDB update: concurrent/replayed requests lose.
    return Users.findOneAndUpdate({...tokenQuery(token, purpose), _id: user._id, salt: previousSalt}, {
        $set: {hash: user.hash, salt: user.salt, ...(purpose === 'registration' ? {active: true} : {})},
        $inc: {passwordVersion: 1},
        $unset: {actionTokenHash: '', actionTokenPurpose: '', actionTokenExpiresAt: ''}
    }, {returnDocument: 'after', runValidators: true});
}
module.exports = {issue, find, consume, digest, TTL};

