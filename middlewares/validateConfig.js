const {config} = require('../config/config')

exports.checkConfig = function checkConfig (parameter) {
  return function (req, res, next) {
    if (config.app[parameter]) return next()
    
    return res.send({message : res.__('Feature is disabled')})
  }
}

exports.checkFeature = function checkFeature (key) {
  return function (req, res, next) {

    if (config.app.getFeature(key)) return next()
    
    return res.send({message : res.__('Feature is disabled')})
  }
}