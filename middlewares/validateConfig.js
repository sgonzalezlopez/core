const {getFeature, config} = require('../config/config')

exports.checkConfig = function checkConfig (parameter) {
  return function (req, res, next) {
    if (config.app[parameter]) return next()
    const error = new Error(res.__('Feature is disabled'));
    error.status = 403;
    return next(error)
  }
}

exports.checkFeature = function checkFeature (key) {
  return function (req, res, next) {
    if (getFeature(key)) return next()
    const error = new Error(res.__('Feature is disabled'));
    error.status = 403;
    return next(error)
  }
}
