const express = require('express');
const verifySignUp = require('../middlewares/verifySignUp');
const actions = require('./actions')
const Users = require("../models/user.model");


const router = express.Router();
const viewRoute = 'private/';

router.get('/', function (req, res, next) {
  actions.renderWithApps(req, res, next, viewRoute + 'index')
});

router.get('/:page', function (req, res, next) {
  var page = req.params.page;
  var data = { title: req.params.page};
  if (req.query.m) data.message = res.__(req.query.m)
  actions.renderWithApps(req, res, next, viewRoute + page, data)
});

router.get('/:page/:id', function (req, res, next) {
  var page = req.params.page;
  actions.renderWithApps(req, res, next, viewRoute + page, null, req.params.id)
});

router.post('/change-password', async (req, res, next) => {
  const data = {};
  try {
    const user = await require('../security/passwords').change(req.user, req.body.id, req.body);
    req.session.authPasswordVersion = user.passwordVersion || 0;
    data.message = res.__('Password changed');
  } catch (err) { data.error = err; res.status(err.status || 400); }
  return actions.renderWithApps(req, res, next, viewRoute + 'change-password', data);
});


module.exports = router;
