const auth = require ('./auth.config')
const app = require ('./app.config')
const db = require ('./db.config')

module.exports.config = {
    app,
    auth,
    db
}


module.exports.forceSSL = function (req, res, next){
    if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    return next();
}