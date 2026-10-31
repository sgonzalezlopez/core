const path = require('path');
if (typeof __modulesPath === 'undefined') global.__modulesPath = path.join(__dirname, "../node_modules")

if (typeof __modelsPath === 'undefined') global.__modelsPath = []
__modelsPath.push(path.join(__dirname, "./models"))

const express = require("express");
const security = require('./security/http');
const { config, forceSSL, loadConfigs, loadFeatures } = require('./config/config')
const localeMiddleware = require('express-locale')
const session = require('express-session');
const Users = require('./models/user.model')
var LokiStore = require('connect-loki')(session);
const MongoStore = require('connect-mongo');
const expressLayouts = require('express-ejs-layouts')
const passport = require('passport');
var fileUpload = require('express-fileupload');
const authJwt = require('./middlewares/auth.jwt')
const i18n = require('./i18n/i18n.config')

function createSessionStore() {
  if (config.app.ENV === 'development') {
    return new LokiStore({ path: path.join(__dirname, '../sessions/session-store.db') })
  }

  if (!config.db.CONFIGS.MONGODB_URI) return null

  return MongoStore.create({
    mongoUrl: config.db.CONFIGS.MONGODB_URI,
    collectionName: 'sessions'
  })
}


module.exports.setupDB = async function () {
}

module.exports.setup = async function (params) {
  await config.db.connectDB()
  await Promise.all([loadConfigs(), loadFeatures()]);


  module.exports.staticPaths = [path.join(__dirname, './public')];

  // tell passport how to serialize the user
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((req, id, done) => {
    let completed = false;
    const finish = (err, user) => {
      if (completed) return;
      completed = true;
      if (err) return done(err);
      if (!user || !user.active || (req.session.authPasswordVersion || 0) !== (user.passwordVersion || 0)) return done(null, false);
      return done(null, user);
    };
    if (params && typeof params.deserializeUser === 'function') {
      try { Promise.resolve(params.deserializeUser(id, finish)).catch(finish); } catch (err) { finish(err); }
    } else {
      Users.findOne({_id: id, active: true}).then(user => finish(null, user)).catch(finish);
    }
  });

  const app = express();

  // set the view engine to ejs

  app.disable('x-powered-by');
  if (config.app.ENV === 'production') {
    const hops = Number(process.env.TRUST_PROXY_HOPS || 1);
    if (!Number.isInteger(hops) || hops < 0 || hops > 5) throw new Error('Invalid TRUST_PROXY_HOPS');
    app.set('trust proxy', hops);
    app.use(forceSSL);
  }

  app.use(security.corsPolicy());

  //
  app.use(fileUpload());

  // parse requests of content-type - application/json
  app.use(express.json());

  // parse requests of content-type - application/x-www-form-urlencoded
  app.use(express.urlencoded({ extended: true }));


  app.use(localeMiddleware({ "priority": ["accept-language", "default"], "default": "es_ES" }))
  app.use(expressLayouts)
  app.set('layout', 'layouts/full');
  app.set('layout extractScripts', true)
  app.set('layout extractStyles', true)
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  app.use(i18n.init)

  const sessionStore = createSessionStore();
  app.use(session(security.sessionOptions(config, sessionStore)));
  require('./passport');
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(authJwt.validateToken);
  app.use(security.csrfProtection);
  app.get('/api/csrf', security.csrfEndpoint);
  app.use((req, res, next) => {
    if (req.authenticationSource === 'query-token' && !req.path.startsWith('/api/')) return res.render('token-login', {layout: false, token: req.query.token, url: require('./security/validation').safeRedirect(req.query.url || req.path)});
    next();
  });
  app.post('/token-login', authJwt.confirmLogin);


  return app;
}

module.exports.configureRoutes = (app) => {
  app.use('/api', require('./api/routes'))
  app.use('/', require('./views-routes/routes'));
  return app;
}

module.exports.configureStatic = (app) => {
  app.use('/toastr', express.static(path.join(__modulesPath, '/toastr')));
  app.use('/jquery', express.static(path.join(__modulesPath, '/jquery')));
  app.use('/jquery-ui', express.static(path.join(__modulesPath, '/jquery-ui')));
  app.use('/inputmask', express.static(path.join(__modulesPath, '/inputmask')));
  app.use('/bootbox', express.static(path.join(__modulesPath, '/bootbox')));
  app.use('/bootstrap', express.static(path.join(__modulesPath, '/bootstrap')));
  app.use('/bootstrap-datepicker', express.static(path.join(__modulesPath, '/bootstrap-datepicker')));
  app.use('/bootstrap-icons', express.static(path.join(__modulesPath, '/bootstrap-icons')));
  app.use('/bootstrap-table', express.static(path.join(__modulesPath, '/bootstrap-table/dist')));
  app.use('/mdi', express.static(path.join(__modulesPath, '/@mdi/font')));
  app.use('/fortawesome', express.static(path.join(__modulesPath, '/@fortawesome/fontawesome-free')));
  app.use('/moment', express.static(path.join(__modulesPath, '/moment')));
  app.use('/locales', express.static(path.join(__modulesPath, '../locales')));
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

function logErrors(err, req, res, next) {
  if (!err.status || err.status >= 500) console.error(err.stack)
  next(err)
}

function clientErrorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (req.xhr || req.originalUrl.startsWith('/api/')) {
    res.status(err.status || 500).send({ error: err.status && err.status < 500 ? err.message : 'Something failed!' })
  } else {
    next(err)
  }
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  res.status(err.status || 500)
  res.render('error', { layout: false, error: err, env: config.app.ENV })
}
