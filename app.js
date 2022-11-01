const express = require("express");
const { v4: uuidv4 } = require('uuid');
const cors = require("cors");
const bodyParser = require('body-parser');
const {config, forceSSL} = require('./config/config')
const localeMiddleware = require('express-locale')
const path = require('path');
const session = require('express-session');
const {Users} = require('./models')
const i18n = require('./i18n/i18n.config')
var LokiStore = require('connect-loki')(session);
const LocalStrategy = require('passport-local').Strategy;
const expressLayouts = require('express-ejs-layouts')
const passport = require('passport');

module.exports.setupDB = async function () {
}

module.exports.setup = async function() {
  await config.db.connectDB()

// configure passport.js to use the local strategy
passport.use(new LocalStrategy(
  {usernameField: 'username' },
  (username, password, done) => {
    // here is where you make a call to the database
    // to find the user based on their username or email address
    // for now, we'll just pretend we found that it was users[0]
    Users.findOne({username: username, active: true})
    .then(user => {
      if(!user || user == null || !user.validPassword(password)) return done(new Error(i18n.__('Invalid user credentials')))
      
      delete user.salt;
      delete user.hash;
      return done(null, user)
    })
  }
));

// tell passport how to serialize the user
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  Users.findOne({_id:id})
  .then(user => {
    if(!user || user == null) return done(new Error(i18n.__('Invalid session user')))
    delete user.salt;
    delete user.hash;
    return done(null, user)
  })
});

const app = express();

// set the view engine to ejs

if (config.app.ENV === 'production') app.use(forceSSL);

app.use(cors());
// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

  
app.use(localeMiddleware({"priority" : ["accept-language", "default"], "default" : "es_ES"}))
  
app.use(expressLayouts)
app.set('layout', 'layouts/full');
app.set('layout extractScripts', true)
app.set('layout extractStyles', true)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(i18n.init)

app.use(session({
    genid: (req) => {
        return uuidv4() // use UUIDs for session IDs
    },
    store: (config.app.ENV=='development' ? new LokiStore({path :path.join(__dirname, '../sessions/session-store.db')}) : ''),
    secret: config.app.COOKIE_SECRET,
    resave: false,
    saveUninitialized: true
}));

return app;
}

module.exports.configureRoutes = (app) => {
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  app.use('/api', require('./api/routes'))
  app.use('/', require('./views-routes/routes'));
  
  return app;
}





