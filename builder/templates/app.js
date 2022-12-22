// Carga de valores de entorno locales.
require('dotenv').config({ override: true })

const core = require("./core/app");
const express = require("express");
const fs = require('fs')
const initialize = require("./core/config/initialize");
const path = require('path');
const { config } = require("core/config/config");

async function run() {
  app = await core.setup()
  
  core.staticPaths.unshift(path.join(__dirname, './public'))

  app = core.configureStatic(app)
  app.use(function (req, res, next) {
    if (req.originalUrl.split('.').length > 1) {
      if (!fs.existsSync(path.join(__dirname, './public', req.originalUrl)) || !fs.existsSync(path.join(__dirname, './core/public', req.originalUrl))) {
        throw new Error('Not found: ' +  req.originalUrl);
      }
    }
    return next();
  });

  app.set('views', [path.join(__dirname, '/views'), path.join(__dirname, '/core/views')]);
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