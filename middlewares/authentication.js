const authJwt = require('./auth.jwt')

module.exports.isAuthenticated = function isAuthenticated(req, res, next) {

    if (req.headers["x-access-token"] || req.query.token) return authJwt.verifyToken(req, res, next);    

    
    if (!req.isAuthenticated || !req.user) return res.status(400).send({ message : res.__('ERR004')})
    else return next();
}

module.exports.isAuthenticatedWeb = function isAuthenticated(req, res, next) {

    if (req.headers["x-access-token"] || req.query.token) return authJwt.verifyToken(req, res, next);    

    
    if (!req.isAuthenticated || !req.user) return res.redirect('/login=url?' + req.originalUrl)
    else return next();
}