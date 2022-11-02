const express = require('express');
const Users = require('../models/user.model')
const passport = require('passport');
const {authentication, verifySignUp} = require('../middlewares/middlewares')
const apps = require('../controllers/app.controller');
const { getFeature } = require('../config/config');


const router = express.Router();
const viewRoute = '';

router.get('/login', function(req, res) {
  res.render('login', {layout: false});
});

router.get('/register', async function(req, res) {
  twoSteps = await getFeature('TWO_STEPS_REGISTRY')
  res.render('register', {layout: false, twoSteps:twoSteps});
});

router.get('/complete-registry/:token', async function(req, res) {

  user = await Users.findOne({salt: req.params.token, active:false, hash:null})
  if (!user) return res.redirect('/login')
  res.render('complete-registry', {layout:false, token: req.params.token})
});

router.post('/complete-registry/:token', async function(req, res, next) {
  if (req.body.password && req.body.passwordVerify && req.body.password != req.body.passwordVerify) return res.status(400).send({ message: res.__('Passwords don\'t match') });

  user = await Users.findOne({salt: req.body.token, active:false, hash:null})
  if (!user) return res.redirect('/login')

  user.setPassword(req.body.password);
  user.active = true
  await user.save();
  
  req.body.username = user.username;
  passport.authenticate('local', (err, user, info) => {
        req.login(user, (err) => {
            res.redirect('/')
        })
    })(req, res, next);
});

router.post('/login', function (req, res, next) {
    passport.authenticate('local', (err, user, info) => {
        req.login(user, (err) => {
            res.redirect('/')
        })
    })(req, res, next);
})

// GET /logout
router.get('/logout', function(req, res, next) {
    if (req.session) {
      // delete session object
      req.session.destroy(function(err) {
        if(err) {
          return next(err);
        } else {
          return res.redirect('/');
        }
      });
    }
  });

router.get('/', function (req, res, next) {
    if (!req.isAuthenticated()) return res.redirect("/login")
    require('./routes').renderWithApps(req, res, next, viewRoute + 'index')
});

router.get('/:page', function (req, res, next) {
  var page = req.params.page;
  require('./routes').renderWithApps(req, res, next, viewRoute + page, {title : req.params.page})
});

module.exports = router;