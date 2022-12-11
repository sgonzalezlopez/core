const feature_model = require('../models/feature.model')
const config_model = require('../models/config.model')
const auth = require ('./auth.config')
const app = require ('./app.config')
const db = require ('./db.config')

var configs = app.CONFIGS;
var features = app.FEATURES;

loadConfigs();
loadFeatures();

module.exports.loadConfigs = loadConfigs;
function loadConfigs() {
    config_model.find()
    .then( items => {
        items.forEach(item => {
            configs[item.key] = item.value
        })
    })
}

module.exports.loadFeatures = loadFeatures;
function loadFeatures() {
    feature_model.find()
    .then( items => {
        items.forEach(item => {
            features[item.key] = item.active
        })
    })
}

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
    if (key == '') return configs;
    var value = configs[key];
    if (typeof(value) == 'undefined') return null;
    else if (value == 'true' || value == 'false') return (value == 'true')
    return value     
}

module.exports.getFeature = (key) => {
    if (key == '') return features;
    var value = features[key];
    if (typeof(value) == 'undefined') return null;
    else if (value == 'true' || value == 'false') return (value == 'true')
    return value
      
}