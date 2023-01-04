// Carga de valores de entorno locales.
require('dotenv').config({ override: true })

const path = require('path');
if (typeof __corePath === 'undefined') global.__corePath = path.join(__dirname, './core')
if (typeof __modulesPath === 'undefined') global.__modulesPath = path.join(__dirname, './node_modules')
if (typeof __modelsPath === 'undefined') global.__modelsPath = []
__modelsPath.push(path.join(__dirname, "./models"))
if (typeof __initialization === 'undefined') global.__initialization = []
__initialization.push(path.join(__dirname, "./config/initialize"))

const core = require(path.join(__corePath, "/app"));
const express = require("express");
const fs = require('fs')
const initialize = require(path.join(__corePath, "/config/initialize"));

const { config } = require(path.join(__corePath, "/config/config"));

async function run() {
  app = await core.setup()
  
  core.staticPaths.unshift(path.join(__dirname, './public'))

  app = core.configureStatic(app)
  app.use(function (req, res, next) {
    if (req.originalUrl.split('.').length > 1) {
      if (!fs.existsSync(path.join(__dirname, './public', req.originalUrl)) || !fs.existsSync(path.join(__corePath, '/public', req.originalUrl))) {
        throw new Error('Not found: ' +  req.originalUrl);
      }
    }
    return next();
  });

  app.set('views', [path.join(__dirname, '/views'), path.join(__corePath, '/views')]);
  app.use('/api', require('./api/routes'))
  app.use('/', require('./views-routes/routes'));
  app = core.configureRoutes(app)


  app = core.configureErrorHandling(app)

  initialize()

  console.log('Entorno:', config.app.ENV);

  // set port, listen for requests
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
}

run()