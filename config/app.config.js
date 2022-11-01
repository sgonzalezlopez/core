const config = require('../models/config.model')
const feature = require('../models/feature.model')


const defaults_config = {
    ADMIN_EMAIL : process.env.ADMIN_EMAIL,
    EMAIL_ACCOUNT : process.env.EMAIL_ACCOUNT,
    EMAIL_PASS : process.env.EMAIL_PASS,
}

const defaults_features = {
    SELF_REGISTER : process.env.SELF_REGISTER || true,
    TWO_STEPS_REGISTRY : process.env.TWO_STEPS_REGISTRY || true,
}

var local_config = {}
var local_features = {}

try {
    local_config = require('../../config/app.config').configs
}
catch {}

try {
    local_features = require('../../config/app.config').features
}
catch {}

let configs = {...defaults_config, ...local_config}
let features = {...defaults_features, ...local_features}

module.exports = {
    JWT_KEY: process.env.JWT_TOKEN,
    COOKIE_SECRET: process.env.COOKIE_SECRET,
    COOKIE_NAME: process.env.COOKIE_NAME || 'cookie',
    ENV: process.env.NODE_ENV || 'development',
    CONFIGS : configs,
    FEATURES : features,
    getConfig : (name) => {
        return config.findOne({name: name})
        .then(v => {
            if (v) return v.value
            else if (typeof configs[name] !== 'undefined') return configs[name]
            else return null
        })        
    },
    getFeature : (key) => {
        return feature.findOne({key: key})
        .then(v => {
            if (v) return v.active
            else if (typeof features[key] !== 'undefined') return features[key]
            else return false
        })        
    }
}