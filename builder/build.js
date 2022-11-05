const ejs = require('ejs')
const { text } = require('body-parser');
const fs = require('fs');
const path = require('path');
// const u = require('./models/user.model')
var routes = null
const default_params = {
    generateForm : true,
    generateList : true,
    view : "",
}

var apis;
var controllers;
var basedir;
var argv;

build()

function build() {
    argv = require('yargs/yargs')(process.argv.slice(2).join(' '))
    .boolean('force')
    .boolean('forceUI')
    .boolean('forceForm')
    .boolean('forceList')
    .alias('ent', 'e')
    .alias('path', 'p')
    .default('path', './')
    .array('ent')
    .argv;

    var originDir = argv.path;
    var entities = argv.ent;

    basedir = path.resolve(originDir) + "/"

    if (!entities || typeof entities == 'undefined') { 
        console.log('Buscando entidades en ', basedir);
        entities = fs.readdirSync(basedir + '/models').map(f => f.split('.')[0])
    }
    
    apis = fs.readdirSync(basedir + '/api')
    controllers = fs.readdirSync(basedir + '/controllers')

    routes_file = basedir + '/api/routes.js'
    if (fs.existsSync(routes_file)) routes = fs.readFileSync(routes_file, 'utf-8').split('\r\n')
    
    entities.map(entity => {
        processEntity(entity)
    })
    fs.writeFile(routes_file, routes.join('\r\n'), (err) => {if (err) throw err;})

}


function processEntity(entityName) {

    if (!fs.existsSync(basedir + 'models/' + entityName + '.model.js')) {
        console.log('Fichero no encontrado:' , basedir + 'models/' + entityName + '.model.js');
        return;
    }
    var model;

    try {
        model = require(basedir + "models/" + entityName + '.model')
    }
    catch (err) {
        console.log('Error procesando el modelo:', entityName);
    }
    
    console.log('Procesando modelo:', entityName);
    try {
        params = JSON.parse(fs.readFileSync(basedir + 'models/' + entityName + '.model.js', 'utf-8').split('\r\n')[0].replace('//', '').trim())
    }
    catch(err) {
        params = {}
    }

    params = {...default_params, ...params}

    console.log('   Parametros de entidad:', JSON.stringify(params));

    if (!apis.includes(`${entityName}.route.js`) || argv.force) generateRouteFile(model, params)

    if (!controllers.includes(`${entityName}.controller.js`) || argv.force) generateControllerFile(model, params)

    if (!routes.some(element => {
        return (element.search('require') >= 0 && element.search(`'./${entityName}.route'`) >= 0)
    })) addRoute(entityName)

    if (params.generateForm) {
        if (!fs.existsSync(`${basedir}/views/${params.view}/${entityName}.ejs`) || argv.force || argv.forceUI || argv.forceForm) generateFormFile(model, params)
    }

    if (params.generateList) {
        if (!fs.existsSync(`${basedir}/views/${params.view}/${entityName}-list.ejs`) || argv.force || argv.forceUI || argv.forceList) generateListFile(model, params)
    }  

}

function addRoute(model) {
    var i = routes.indexOf('// Routes')
    routes.splice(i+1, 0, `router.use('/${model}', require('./${model}.route'))`)
}

async function generateFormFile(model, params) {
    console.log('   Generando UI_FORM para', model.modelName);

    var text = await ejs.renderFile(params.generateFullForm ? './core/builder/templates/formFull.ejs' : './core/builder/templates/form.ejs', {model:model, params:params})
    fs.writeFile(`${basedir}/views/${params.view}/${model.modelName.toLowerCase()}.ejs`, cleanText(text), (err) => {if (err) throw err;})
}

async function generateListFile(model, params) {
    console.log('   Generando UI_LIST para', model.modelName);

    var text = await ejs.renderFile('./core/builder/templates/list.ejs', {model:model, params:params})
    fs.writeFile(`${basedir}/views/${params.view}/${model.modelName.toLowerCase()}-list.ejs`, cleanText(text), (err) => {if (err) throw err;})
}

async function generateRouteFile(model, params) {
    console.log('   Generando API para', model.modelName);

    var text = await ejs.renderFile('./core/builder/templates/api.js', {model:model, params:params})
    fs.writeFile(`${basedir}/api/${model.modelName.toLowerCase()}.route.js`, text, (err) => {if (err) throw err;})
}

async function generateControllerFile(model, params) {
    console.log('   Generando CONTROLLER para', model.modelName);

    var text = await ejs.renderFile('./core/builder/templates/controller.js', {model:model, params:params})
    fs.writeFile(`${basedir}/controllers/${model.modelName.toLowerCase()}.controller.js`, text, (err) => {if (err) throw err;})
}

function cleanText(text) {
    var arr = text.split('\r\n')
    var arrClean = arr.filter(a => a.replace(/[^\x20-\x7E]/g, '').trim() != '')
    return arrClean.join('\r\n')
}