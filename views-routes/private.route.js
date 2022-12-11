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

router.post('/change-password', verifySignUp.validateNewPassword, function (req, res, next) {
  var data = {}
  if (req.error) {
    data.error = req.error;
    delete req.error;
    return actions.renderWithApps(req, res, next, viewRoute + "change-password", data)
  }
  if (req.user.id != req.body.id) throw new Error(res.__('Invalid operation'))
  else {
    Users.findById(req.user.id)
    .then(async user => {
      await user.setPassword(req.body.newPassword)
      await user.save()
      data.message = res.__('Password changed')
      return actions.renderWithApps(req, res, next, viewRoute + "change-password", data)
      res.redirect('/change-password?m=001')
    })
    .catch(err => {
      data.error = err;
      return actions.renderWithApps(req, res, next, viewRoute + "change-password", data)
    })
  }
})


module.exports = router;