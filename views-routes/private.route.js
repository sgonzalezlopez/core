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
  actions.renderWithApps(req, res, next, viewRoute + page, {title : req.params.page})
});

router.get('/:page/:id', function (req, res, next) {
  var page = req.params.page;
  actions.renderWithApps(req, res, next, viewRoute + page, null, req.params.id)
});

router.post('/change-password', function (req, res, next) {
  if (req.user.id != req.body.id) throw new Error(res.__('Invalid operation'))
  
  var data = {}
  if (req.body.newPassword != req.body.newPasswordVerify) {
    data.error = res.__('Password don\'t match')
    return actions.renderWithApps(req, res, next, viewRoute + "change-password", data)
  }
  else {
    Users.findById(req.user.id)
    .then(async user => {
      if (!user || user == null) data.error = res.__('Invalid user')
      else if (!user.validPassword(req.body.oldPassword)) data.error = res.__('Invalid credentials')
      else {
        user.setPassword(req.body.newPassword)
        await user.save()
        data.message = res.__('Password changed') 
      }
      
      return actions.renderWithApps(req, res, next, viewRoute + "change-password", data)
    })
  }
})
  

module.exports = router;