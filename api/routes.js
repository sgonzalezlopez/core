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

// Routes
router.use('/permission', [authentication.isAuthenticated, authorization.isAdmin], require('./permission.route'))
router.use('/auth', auth)
router.use('/user', [authentication.isAuthenticated], users)
router.use('/app', [authentication.isAuthenticated], apps)
router.use('/config', [authentication.isAuthenticated, authorization.isAdmin], config)
router.use('/feature', [authentication.isAuthenticated, authorization.isAdmin], features)
router.use('/value', [authentication.isAuthenticated], values)

module.exports = router;
