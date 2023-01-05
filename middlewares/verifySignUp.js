const Users = require("../models/user.model");
const config = require('../config/config')



checkInputData = (req, res, next) => {
  try {
    if (!req.body.username || !req.body.email) throw (new Error(res.__('Missing username or email')));
    if (req.body.email && !String(req.body.email).toLowerCase().match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )) throw (new Error(req.__('Invalid email address')));
    return next();

  }
  catch (err) {
    console.error(err);
    req.error = err;
    next()
  }
}


checkDuplicateUsernameOrEmail = (req, res, next) => {
  // Username
  Users.findOne({
    username: req.body.username
  }).exec((err, user) => {
    if (err) {
      req.error = err;
      return next()
    }

    if (user) {
      req.error = new Error(res.__('Failed! Username is already in use!'))
      return next();
    }

    // Email
    Users.findOne({
      email: req.body.email
    }).exec((err, user) => {
      if (err) { req.error = err; next();}

      if (user) req.error = (new Error(res.__('Failed! Email is already in use!')));
      return next();
    });
  });
};

validateNewPassword = async (req, res, next) => {
  try {

    if (req.user.roles.includes('admin')) return next();

    var regexpText = await config.getConfig('PASSWORD_COMPLEXITY');
    var regexp = null;
    if (regexpText || regexpText != '') regexp = RegExp(regexpText)

    if (req.user && req.user.id != req.body.id) throw new Error(res.__('Invalid operation'))
    else if (req.body.password != req.body.passwordVerify) throw new Error(res.__('Password does not match'))
    else if (regexp != null && regexp != '' && !regexp.test(req.body.password)) {
      err = new Error(res.__('Password does not match complexity'))
      err.detail = res.__(regexpText)
      throw err
    }
    else if (req.user) {
      Users.findById(req.user.id)
        .then(user => {
          if (!user || user == null) req.error = new Error(res.__('Invalid user'))
          else if (user.validPassword(req.body.oldPassword)) return next()
          req.error = new Error(res.__('Old password is not valid'))
          next();
        })
    }
    else return next()
  }
  catch (err) {
    console.error(err);
    req.error = err;
    next()
  }
}

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  validateNewPassword,
  checkInputData,
};

module.exports = verifySignUp;