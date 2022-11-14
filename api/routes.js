const express = require('express')
const router = express.Router();
const authentication = require('../middlewares/authentication')
const authorization = require('../middlewares/authorization')

const auth = require('./auth.route')
const users = require('./user.route')
const apps = require('./app.route')
const config = require('./config.route')
const features = require('./feature.route')
const values = require('./value.route')

router.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

// Routes
router.use('/permission', [authentication.isAuthenticated, authorization.isAdmin], require('./permission.route'))
router.use('/auth', auth)
router.use('/user', [authentication.isAuthenticated], require('./user.route'))
router.use('/app', [authentication.isAuthenticated], require('./app.route'))
router.use('/config', [authentication.isAuthenticated, authorization.isAdmin], require('./config.route'))
router.use('/feature', [authentication.isAuthenticated, authorization.isAdmin], require('./feature.route'))
router.use('/value', [authentication.isAuthenticated], require('./value.route'))

module.exports = router;

