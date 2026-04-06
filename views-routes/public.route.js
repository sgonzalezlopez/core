const express = require('express');
const Users = require('../models/user.model')
const passport = require('passport');
const { verifySignUp, authorization, authentication, validateConfig } = require("../middlewares/middlewares");
const { getFeature } = require('../config/config');
const actions = require('./actions')
const controller = require('../controllers/auth.controller')
const router = express.Router();
const viewRoute = '';
const jwt = require('../middlewares/auth.jwt')
const config = require('../config/config')
const fs = require('fs')
const path = require('path')

function getViewPaths(req) {
  const configuredViews = req.app.get('views')

  if (Array.isArray(configuredViews)) return configuredViews
  if (!configuredViews) return []

  return [configuredViews]
}

function viewExists(req, view) {
  return getViewPaths(req).some(viewPath => fs.existsSync(path.join(viewPath, `${view}.ejs`)))
}

function getPrivateFallbackPath(req, page, id) {
  const privateView = `private/${page}`

  if (!viewExists(req, privateView)) return null

  return id ? `/private/${page}/${id}` : `/private/${page}`
}

router.get('/login', function (req, res) {
  var data =  { layout: false, selfRegister: getFeature('SELF_REGISTER') }
  if (req.query.registerSucceed != null) data.message = res.__('Registration complete. You can now access.')
  if (req.query.registerPending != null) data.message = res.__('Email sent to complete the registration process.')
  if (req.query.errorNotUser != null) data.message = res.__('Invalid link.')
  res.render('login', data);
});

router.post('/signup', validateConfig.checkFeature('SELF_REGISTER'), validateConfig.checkFeature('TWO_STEPS_REGISTRY'), verifySignUp.checkInputData, verifySignUp.checkDuplicateUsernameOrEmail, controller.register);
router.post('/register', validateConfig.checkFeature('SELF_REGISTER'), verifySignUp.checkInputData, verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.validateNewPassword, controller.register);

router.get('/register', async function (req, res) {
  twoSteps = getFeature('TWO_STEPS_REGISTRY')
  res.render('register', { layout: false, twoSteps: twoSteps });
});

router.get('/complete-registry/:token', async function (req, res) {
  res.render('complete-registry', { layout: false, token: req.params.token })
});

router.post('/complete-registry/:token', verifySignUp.validateNewPassword, controller.completeRegistration);

router.post('/login', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    req.login(user, (err) => {
      if (err) res.render('login', {layout: false, error : res.__('User/password incorrect')})
      else {
        res.redirect(req.query.url || req.body.url || "/")
      }
    })
  })(req, res, next);
})

// GET /logout
router.get('/logout', function (req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});

router.get('/', function (req, res, next) {
  actions.renderWithApps(req, res, next, viewRoute + 'index')
});

router.get('/:page', function (req, res, next) {
  var page = req.params.page;
  const privateFallbackPath = getPrivateFallbackPath(req, page)

  if (!viewExists(req, page) && privateFallbackPath) {
    return res.redirect(privateFallbackPath)
  }

  actions.renderWithApps(req, res, next, viewRoute + page, { title: req.params.page })
});

router.get('/:page/:id', function (req, res, next) {
  var page = req.params.page;
  const privateFallbackPath = getPrivateFallbackPath(req, page, req.params.id)

  if (!viewExists(req, page) && privateFallbackPath) {
    return res.redirect(privateFallbackPath)
  }

  actions.renderWithApps(req, res, next, viewRoute + page, null, req.params.id)
});

module.exports = router;