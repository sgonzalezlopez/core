const express = require('express')
const router = express.Router();
const authentication = require('../middlewares/authentication')
const authorization = require('../middlewares/authorization')
const apps = require('../controllers/app.controller')
const public = require('./public.route')
const private = require('./private.route')
const admin = require('./admin.route');
const i18n = require('../i18n/i18n.config');
const { getFeature } = require('../config/config');
const { db } = require('../models/config.model');
const fs = require('fs')

router.use('/admin', authorization.isAdmin, admin)
router.use('/private', authentication.isAuthenticatedWeb, private)
router.use('/', public)

module.exports = router;