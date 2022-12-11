const {getFeature} = require('../config/config')

exports.checkConfig = function checkConfig (parameter) {
  return function (req, res, next) {
    if (config.app[parameter]) return next()
    return next(new Error(res.__('Feature is disabled')))
  }
}

exports.checkFeature = function checkFeature (key) {
  return function (req, res, next) {
    if (getFeature(key)) return next()
    return next(new Error(res.__('Feature is disabled')))
  }
}