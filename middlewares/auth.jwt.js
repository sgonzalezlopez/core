const jwt = require("jsonwebtoken");
const config = require("../config/config");
const Users = require("../models/user.model");

function getToken(req) {
  return req.headers["x-access-token"] || req.query.token;
}

function getJwtSecret() {
  return config.config.auth.JWT_SECRET;
}

async function loadAuthenticatedUser(token) {
  const decoded = jwt.verify(token, getJwtSecret());
  const user = await Users.findOne({ _id: decoded.id, active: true });

  if (!user) throw new Error('Invalid authenticated user');

  return user;
}

async function verifyToken(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(403).send({ message: res.__('ERR003') });

  try {
    const user = await loadAuthenticatedUser(token);
    req.userId = user.id;
    req.user = user;
    return next();
  }
  catch (err) {
    return res.status(401).send({ message: res.__('ERR003') });
  }
}

async function validateToken(req, res, next) {
  const token = getToken(req);
  if (!token) return next();

  try {
    const user = await loadAuthenticatedUser(token);
    req.userId = user.id;
    req.user = user;
  }
  catch (err) {
    // This middleware is global and optional; protected routes report token errors.
  }
  return next();
}

function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username, roles: user.roles }, getJwtSecret(), {
    expiresIn: 86400 // 24 hours
  });
}
const authJwt = { 
    verifyToken,
    validateToken,
    generateToken
};

module.exports = authJwt;