const express = require("express");
const { v4: uuidv4 } = require('uuid');
const cors = require("cors");
const bodyParser = require('body-parser');
const { config, forceSSL } = require('./config/config')
const localeMiddleware = require('express-locale')
const path = require('path');
const session = require('express-session');
const Users = require('./models/user.model')
const i18n = require('./i18n/i18n.config')
var LokiStore = require('connect-loki')(session);
const LocalStrategy = require('passport-local').Strategy;
const expressLayouts = require('express-ejs-layouts')
const passport = require('passport');

module.exports.setupDB = async function () {
}

module.exports.setup = async function (params) {
  await config.db.connectDB()


  module.exports.staticPaths = [path.join(__dirname, './public')];

  // configure passport.js to use the local strategy
  passport.use(new LocalStrategy(
    { usernameField: 'username' },
    (username, password, done) => {
      // here is where you make a call to the database
      // to find the user based on their username or email address
      // for now, we'll just pretend we found that it was users[0]
      Users.findOne({ username: username, active: true })
        .then(user => {
          if (!user || user == null || !user.validPassword(password)) return done(new Error(i18n.__('Invalid user credentials')))

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

  if (params && params.hasOwnProperty('deserializeUser') && params.deserializeUser) {
    passport.deserializeUser((id, done) => {params.deserializeUser(id, done)})
  } else {
    passport.deserializeUser((id, done) => {
      Users.findOne({ _id: id })
        .then(user => {
          if (!user || user == null) return done(new Error(i18n.__('Invalid session user')))
          delete user.salt;
          delete user.hash;
          return done(null, user)
        })
    });
  }

  const app = express();

  // set the view engine to ejs

  if (config.app.ENV === 'production') app.use(forceSSL);

  app.use(cors());

  // parse requests of content-type - application/json
  app.use(express.json());

  // parse requests of content-type - application/x-www-form-urlencoded
  app.use(express.urlencoded({ extended: true }));


  app.use(localeMiddleware({ "priority": ["accept-language", "default"], "default": "es_ES" }))
  enableMultipleViewFolders(express);
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
    store: (config.app.ENV == 'development' ? new LokiStore({ path: path.join(__dirname, '../sessions/session-store.db') }) : ''),
    secret: config.app.COOKIE_SECRET,
    resave: false,
    saveUninitialized: true
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  return app;
}

module.exports.configureRoutes = (app) => {
  app.use('/api', require('./api/routes'))
  app.use('/', require('./views-routes/routes'));
  return app;
}

module.exports.configureStatic = (app) => {
  app.use('/bootstrap', express.static(path.join(__dirname, '../node_modules/bootstrap')));
  app.use('/bootstrap-table', express.static(path.join(__dirname, '../node_modules/bootstrap-table/dist')));
  app.use('/mdi', express.static(path.join(__dirname, '../node_modules/@mdi/font')));
  app.use('/fortawesome', express.static(path.join(__dirname, '../node_modules/@fortawesome/fontawesome-free')));
  app.use('/moment', express.static(path.join(__dirname, '../node_modules/moment')));
  for (let i = 0; i < this.staticPaths.length; i++) {
    const element = this.staticPaths[i];
    app.use(express.static(element));
  }
  

  return app;
}

module.exports.configureErrorHandling = (app) => {
  app.use(logErrors)
  app.use(clientErrorHandler)
  app.use(errorHandler)

  return app;
}

function enableMultipleViewFolders(express) {
  var renderProxy = express.response.render;
  express.render = function () {
    app.set('views', 'path/to/custom/views');
    try {
      return renderProxy.apply(this, arguments);
    }
    catch (e) { }
    app.set('views', 'path/to/default/views');
    return renderProxy.apply(this, arguments);
  };
}


function logErrors(err, req, res, next) {
  console.error(err.stack)
  next(err)
}

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ error: 'Something failed!' })
  } else {
    next(err)
  }
}

function errorHandler(err, req, res, next) {
  res.status(500)
  res.render('error', { layout: false, error: err, env: config.app.ENV })
}