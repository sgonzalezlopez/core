# Componentes CORE para aplicaciones con nodejs y express
## Qué son los componentes de CORE
Los componentes CORE son un conjunto de desarrollos que permiten crear de manera rápida y sencilla una aplicación web basada en NodeJS, express y MongoDB.

## Como utilizar los componentes core en una nueva aplicación?
Pasos para la configuración de un nuevo proyecto basado en CORE
1. Inicializar la aplicación NODE (en main especificar app.js)
```
npm init
```
2. Inicializar el repositorio de Github para la nueva aplicación
```
git init
git add *
git branch -M main
git commit -m "First commit"
git remote add origin URL_REPOSITORIO_NUEVO
git push -u origin master
```
3. Añadir la referencia al módulo CORE en github
```
git submodule add https://github.com/sgonzalezlopez/core.git
```
4. Incluir la dependencia a CORE en el fichero `./package.json`
```
npm install ./core
```
5. Inicializar la aplicación
```
node ./core/builder/build --i --app NOMBRE_APP --mongoServer MONGO_URI
```
6. Inciar la base de datos y lanzar la aplicación
7. Configurar applicaciones y valores custom creando el fichero ./config/initialize.js con el contenido deseado por defecto. Por ejemplo:
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

## Ayuda en la correción de errores en EJS
Cuando se producen errores en la compilación de los ficheros EJS y no se obtiene información relevante, se puede ejecutar el comando:
```
ejslint {nombre_fichero}
```

## Referencias externas y librerías utilizadas
- [Wenzhixin Bootstrap Table](https://bootstrap-table.com/)
- [Wrappixel Dashboard](https://demos.wrappixel.com/free-admin-templates/bootstrap/matrix-bootstrap-free/html/index.html)
- [Icon set Material Design](https://pictogrammers.github.io/@mdi/font/2.0.46/)
