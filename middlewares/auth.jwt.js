const jwt = require("jsonwebtoken");
const config = require("../config/config");
const Users = require("../models/user.model");
const passport = require('passport');

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

 validateToken = (req, res, next) => {
  let token = req.headers["x-access-token"] || req.query.token
  if (!token) return next()

  try {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next()
  
      
      // req.body.username = user.username;
      
      jwtPayload = decoded;
      passport.authenticate('jwt', (err, user, info) => {
        req.login(user, (err) => {
          if (err) throw err
          res.redirect(req.query.url || "/")
        })
      })(req, res, next);
      // next();
    });

  }
  catch (err) {
    console.error(err);
    
  }
};


generateToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username}, process.env.JWT_SECRET, {
    expiresIn: 86400 // 24 hours
  });
}
const authJwt = { 
    verifyToken,
    validateToken,
    generateToken
};

module.exports = authJwt;