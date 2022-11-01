const jwt = require("jsonwebtoken");
const {config} = require("../config/config");
const {Users} = require("../models");

verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: res.__('ERR003')});
  }

  jwt.verify(token, config.auth.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: res.__('ERR003') });
    }
    req.userId = decoded.id;
    req.user = decoded;
    next();
  });
};

const authJwt = { 
    verifyToken
};

module.exports = authJwt;