# Componentes CORE para aplicaciones con nodejs y express
## Qué son los componentes de CORE
Los componentes CORE son un conjunto de desarrollos que permiten crear de manera rápida y sencilla una aplicación web basada en NodeJS, express y MongoDB.

## Como utilizar los componentes core en una nueva aplicación?
Pasos para la configuración de un nuevo proyecto basado en CORE
1. Crear la carpeta del proyecto con la siguient estructura interna
```
 -- root(nombre aplicacion)
  |--/ api
  |--/ config
     |-- app.config.js
  |--/ controllers
  |--/ locales
  |--/ models
  |--/ sessions
  |--/ views
  |--/ views-routes
```
2. Inicializar la aplicación NODE
```
npm init
```
3. Inicializar el repositorio de Github para la nueva aplicación
```
git init
git add *
git commit -m "First commit"
git branch -M master
git remote add origin URL_REPOSITORIO_NUEVO
git push -u origin master
```
4. Añadir la referencia al módulo CORE en github
```
git submodule add https://github.com/sgonzalezlopez/core.git
```
5. Crear el fichero .gitignore con el siguiente contenido
```
node_modules
sessions
dev.config.js
```
6. Incluir la dependencia a CORE en el fichero ```./package.json```
```
{
  "name": "app_name",
  "version": "1.0.0",
  "description": "",
  "main": "app.js",
  "dependencies": {
    "core": "file:core"
  },
  "scripts": {
    "start": "node app.js"
  },
  "author": "",
  "license": "ISC"
}
```
7. Instalar todas las referencias del proyecto core
```
npm install
```
8. Crear el archivo ```./app.js``` en la carpeta ROOT con el contenido siguiente
```
// Carga de valores de entorno locales.
try {
  const { initLocals } = require("./dev.config");
  initLocals()
}
catch (err){
  console.error(err);
}

const { setup, configureRoutes } = require("./core/app");
const express = require("express");

const initialize = require("./core/config/initialize");
const path = require('path');
const { config } = require("core/config/config");

async function run() {
  app = await setup()
  app.set('views', [path.join(__dirname, '/views'), path.join(__dirname, '/core/views')]);
  
  app.use(express.static(path.join(__dirname, './core/public')));
  
  app = configureRoutes(app)
  
  initialize()
  
  console.log('Entorno:', config.app.ENV);
    
  // set port, listen for requests
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
}

run()
```
9. Copiar y renombrar el fichero ```./core/dev.config.template.js``` a ```./dev.config.js```
10. Actualizar el contenido del fichero `./dev.config.js` con la información correcta
```
module.exports.initLocals = () => {
    process.env.MONGODB_URI = ''
    process.env.ADMIN_EMAIL =''
    process.env.EMAIL_ACCOUNT =''
    process.env.EMAIL_PASS = ''
    process.env.JWT_SECRET = ''   
    process.env.COOKIE_SECRET = '' 
    process.env.COOKIE_NAME = ''
    process.env.ENABLE_EMAIL_SEND = false
    process.env.ENABLE_EMAIL_PREVIEW = true
}
```
12. Actualizar el contenido del fichero `./config/app.config.js`
```
module.exports.configs = {
}

module.exports.features = {
}
```
12. Inciar la base de datos y lanzar la aplicación
13. Configurar applicaciones y valores custom creando el fichero ./config/initialize.js con el contenido
```
const applications = [
    {name: 'app1', type: ['user', 'side'], roles:['user', 'reader'], level:1, link:'/app-link', icon:'icon-class'},
    {name: 'app2', type: ['action'], roles:['public', 'user', 'reader'], level:2, link:'/app-link2', icon:'icon-class'},
]

const values = [
    {type: 'test-category', value: 'sample1', text: 'sample1_text', order : 0},
    {type: 'test-category', value: 'sample2', text: 'sample2_text', order : 1},
]

module.exports.applications = applications
module.exports.values = values
```



## Referencias externas y librerías utilizadas

- [Icon set Material Design](https://zavoloklom.github.io/material-design-iconic-font/icons.html)
