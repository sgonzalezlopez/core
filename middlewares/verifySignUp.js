const Users = require("../models/user.model");
const config = require('../config/config')



const checkInputData = (req, res, next) => {
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


const checkDuplicateUsernameOrEmail = (req, res, next) => {
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
      if (err) {
        req.error = err;
        return next();
      }

      if (user) req.error = (new Error(res.__('Failed! Email is already in use!')));
      return next();
    });
  });
};

const validateNewPassword = async (req, res, next) => {
  try {
    const password = req.body.newPassword || req.body.password;
    const passwordVerify = req.body.newPasswordVerify || req.body.passwordVerify;
    const targetUserId = req.params.id || req.body.id;

    if (!password) throw new Error(res.__('Password does not match complexity'));

    var regexpText = await config.getConfig('PASSWORD_COMPLEXITY');
    var regexp = null;
    if (regexpText) regexp = RegExp(regexpText)

    if (passwordVerify && password !== passwordVerify) throw new Error(res.__('Password does not match'))
    if (regexp && !regexp.test(password)) {
      const err = new Error(res.__('Password does not match complexity'))
      err.detail = res.__(regexpText)
      throw err
    }
    if (!req.user || (Array.isArray(req.user.roles) && req.user.roles.includes('admin'))) {
      req.newPassword = password;
      return next();
    }

    if (req.user.id !== targetUserId) throw new Error(res.__('Invalid operation'))

    const user = await Users.findById(req.user.id);
    if (!user) throw new Error(res.__('Invalid user'));
    if (!user.validPassword(req.body.oldPassword)) throw new Error(res.__('Old password is not valid'));

    req.newPassword = password;
    return next();
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