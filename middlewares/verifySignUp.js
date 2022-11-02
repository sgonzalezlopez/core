const Users = require("../models/user.model");



checkInputData = (req, res, next) => {
  if (!req.body.username || !req.body.email) return res.status(400).send({ message: res.__('Missing username or email') });
  if (req.body.password && !String(req.body.password).toLowerCase().match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )) return res.status(400).send({ message: res.__('Invalid email address') });
  if (req.body.password && req.body.passwordVerify && req.body.password != req.body.passwordVerify) return res.status(400).send({ message: res.__('Passwords don\'t match') });
  next();
}


checkDuplicateUsernameOrEmail = (req, res, next) => {
  // Username
  Users.findOne({
    username: req.body.username
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (user) {
      res.status(400).send({ message: res.__('Failed! Username is already in use!') });
      return;
    }

    // Email
    Users.findOne({
      email: req.body.email
    }).exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (user) {
        res.status(400).send({ message: res.__('Failed! Email is already in use!')});
        return;
      }

      next();
    });
  });
};

validateNewPassword = (req, res, next) => {
  if (req.body.newPassword != req.body.newPasswordVerify) return res.status(400).send({message : res.__('Password does not match.')})
  Users.findById(req.params.id)
  .then(user => {
    if (!user || user == null) return res.status(400).send({message : res.__('Invalid user.')})
    if (!user.validPassword(req.body.oldPassword)) return res.status(400).send({message : res.__('Old password is not valid.')})
  })
}

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  validateNewPassword,
  checkInputData,
};

module.exports = verifySignUp;