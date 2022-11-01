const express = require('express')
const router = express.Router();
const authentication = require('../middlewares/authentication')
const authorization = require('../middlewares/authorization')

const auth = require('./auth.route')
const users = require('./users.route')
const apps = require('./apps.route')
const config = require('./config.route')
const features = require('./features.route')
const values = require('./values.route')

router.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

router.use('/auth', auth)
router.use('/users', [authentication.isAuthenticated], users)
router.use('/apps', [authentication.isAuthenticated], apps)
router.use('/config', [authentication.isAuthenticated, authorization.isAdmin], config)
router.use('/features', [authentication.isAuthenticated, authorization.isAdmin], features)
router.use('/values', [authentication.isAuthenticated, authorization.isAdmin], values)

module.exports = router;

