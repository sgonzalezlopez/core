const defaults_config = {
    ADMIN_EMAIL : process.env.ADMIN_EMAIL,
    EMAIL_ACCOUNT : process.env.EMAIL_ACCOUNT,
    EMAIL_PASS : process.env.EMAIL_PASS,
}

const defaults_features = {
    SELF_REGISTER : process.env.SELF_REGISTER || true,
    TWO_STEPS_REGISTRY : process.env.TWO_STEPS_REGISTRY || true,
    ALWAYS_REFRESH_MENU : false,
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

let configs_items = {...defaults_config, ...local_config}
let features_items = {...defaults_features, ...local_features}

module.exports = {
    JWT_KEY: process.env.JWT_TOKEN,
    COOKIE_SECRET: process.env.COOKIE_SECRET,
    COOKIE_NAME: process.env.COOKIE_NAME || 'cookie',
    ENV: process.env.NODE_ENV || 'development',
    CONFIGS : configs_items,
    FEATURES : features_items
}