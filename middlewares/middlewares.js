const authJwt = require("./auth.jwt");
const verifySignUp = require("./verifySignUp");
const authentication = require("./authentication");
const authorization = require("./authorization");
const errorHandling = require("./errorHandling");
const validateConfig = require('./validateConfig')

module.exports = {
  authJwt,
  verifySignUp,
  authorization,
  authentication,
  errorHandling,
  validateConfig
};