'use strict';
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user.model');
const i18n = require('./i18n/i18n.config');
const {config} = require('./config/config');
const {Strategy: JWTStrategy, ExtractJwt} = require('passport-jwt');
passport.use(new LocalStrategy({usernameField: 'username', passwordField: 'password'}, (username, password, cb) => {
    if (typeof username !== 'string' || typeof password !== 'string') return cb(null, false);
    return User.findOne({username, active: true}).then(async user => {
        if (!user || !user.validPassword(password)) return cb(null, false, {message: i18n.__('Invalid user credentials')});
        user.lastLogin = new Date();
        await user.save();
        return cb(null, user);
    }).catch(cb);
}));
passport.use(new JWTStrategy({jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromUrlQueryParameter('token'), ExtractJwt.fromBodyField('token'), ExtractJwt.fromAuthHeaderAsBearerToken(), ExtractJwt.fromHeader('x-access-token')]), secretOrKey: config.auth.JWT_SECRET, algorithms: ['HS256']}, (payload, cb) => {
    return User.findOne({_id: payload.id, active: true}).then(user => {
        if (!user || (payload.passwordVersion || 0) !== (user.passwordVersion || 0)) return cb(null, false);
        return cb(null, user);
    }).catch(cb);
}));
