const feature_model = require('../models/feature.model')
const config_model = require('../models/config.model')
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


module.exports.getConfig = (key) => {
    return config_model.findOne({key: key})
    .then(v => {
        var value = null;
        if (v) {
            value = v.value
        }
        else if (typeof app.CONFIGS[key] !== 'undefined') value = app.CONFIGS[key]
        else if (typeof process.env[key] !== 'undefined') value = process.env[key]
        else return null
        if (value == 'true' || value == 'false') return (value == 'true')
        return value
    })      
}

module.exports.getFeature = (key) => {
    return feature_model.findOne({key: key})
    .then(v => {
        if (v) return v.active
        else if (typeof app.FEATURES[key] !== 'undefined') return app.FEATURES[key]
        else if (typeof process.env[key] !== 'undefined') return process.env[key]
        else return false
    })        
}