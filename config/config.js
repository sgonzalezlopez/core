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
    const config_model = require('../models/config.model')
    return config_model.findOne({key: key})
    .then(v => {
        if (v) {
            if (v.value == 'true' || v.value == 'false') return (v.value == 'true')
            return v.value
        }
        else if (typeof app.CONFIGS[key] !== 'undefined') return app.CONFIGS[key]
        else return null
    })      
}

module.exports.getFeature = (key) => {
    const feature_model = require('../models/feature.model')
    return feature_model.findOne({key: key})
    .then(v => {
        if (v) return v.active
        else if (typeof app.FEATURES[key] !== 'undefined') return app.FEATURES[key]
        else return false
    })        
}