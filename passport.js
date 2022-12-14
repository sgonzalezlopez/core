//passport.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user.model')
const i18n = require('./i18n/i18n.config')
const config = require('./config/config')


passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password'
    }, 
    function (username, password, cb) {
        //this one is typically a DB call. Assume that the returned user object is pre-formatted and ready for storing in JWT
        return User.findOne({ username: username, active: true })
           .then(user => {
               if (!user || user == null || !user.validPassword(password)) {
                   return cb(null, false, {message: i18n.__('Invalid user credentials')});
               }
               delete user.salt;
               delete user.hash;
               return cb(null, user, {message: 'Logged In Successfully'});
          })
          .catch(err => cb(err));
    }
));

//passport.js
const passportJWT = require("passport-jwt");
const JWTStrategy   = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromUrlQueryParameter('token') || ExtractJWT.fromBodyField('token') || ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey   : process.env.JWT_SECRET
    },
    function (jwtPayload, cb) {

        //find the user in db if needed. This functionality may be omitted if you store everything you'll need in JWT payload.
        return User.findOne({_id: jwtPayload.id, active : true})
            .then(user => {
               delete user.salt;
               delete user.hash;
                return cb(null, user);
            })
            .catch(err => {
                return cb(err);
            });
    }
));