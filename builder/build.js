const ejs = require('ejs')
const { text } = require('body-parser');
const fs = require('fs');
const path = require('path');
// const u = require('./models/user.model')
var routes = null
const default_params = {
    generateForm : true,
    generateList : true,
    generateSearch : true,
    view : "",
}

var apis;
var controllers;
var basedir;
var argv;

build()

// **** // Parameters
// -p : Root path to find models folder
// -e : List of models to process
// -force : Force changes in all objects
// -forceUI : Force changes in UI objects
// -forceForm : Force generation of forms page
// -forceList : Force generation of list page
// -forceSearch : Force generation of search page
// -generateFullForm : Indicates if the process generates the entire form page or a reference to dynamic form
// -fullForm : Equal to generateFullForm
// -view: Folder to contain the pages and class to process requests

function build() {
    argv = require('yargs/yargs')(process.argv.slice(2).join(' '))
    .alias('forceForm', 'ff')
    .alias('ent', 'e')
    .alias('path', 'p')
    .default('path', './')
    .array('ent')
    .boolean('force')
    .boolean('forceUI')
    // .boolean('forceForm')
    .boolean('forceList')
    .argv;

    var originDir = argv.path;
    var entities = argv.ent;

    basedir = path.resolve(originDir) + "/"

    if (!entities || typeof entities == 'undefined' || entities.length == 0) { 
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

    params = {...default_params, ...params, ...argv}

    if (argv.fullForm) params.generateFullForm = argv.fullForm

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

    if (params.generateSearch) {
        if (!fs.existsSync(`${basedir}/views/${params.view}/${entityName}-search.ejs`) || argv.force || argv.forceUI || argv.forceSearch) generateSearchFile(model, params)
    }  

}

function addRoute(model) {
    var i = routes.indexOf('// Routes')
    routes.splice(i+1, 0, `router.use('/${model}', require('./${model}.route'))`)
}

async function generateFormFile(model, params) {
    console.log('   Generando UI_FORM para', model.modelName);
    model.schema.paths._id.options.hideInForm = true;
    model.schema.paths.__v.options.hideInForm = true;
    if (model.schema.paths.createdAt) model.schema.paths.createdAt.options.readOnly = true;
    if (model.schema.paths.updatedAt) model.schema.paths.updatedAt.options.readOnly = true;

    var text = await ejs.renderFile(params.generateFullForm ? './core/builder/templates/formFull.ejs' : './core/builder/templates/form.ejs', {model:model, params:params})
    fs.writeFile(`${basedir}/views/${params.view}/${model.modelName.toLowerCase()}.ejs`, cleanText(text), (err) => {if (err) throw err;})
}

async function generateListFile(model, params) {
    console.log('   Generando UI_LIST para', model.modelName);
    model.schema.paths._id.options.hideInForm = true;
    model.schema.paths.__v.options.hideInForm = true;
    if (model.schema.paths.createdAt) model.schema.paths.createdAt.options.hideInForm = true;
    if (model.schema.paths.updatedAt) model.schema.paths.updatedAt.options.hideInForm = true;

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

async function generateSearchFile(model, params) {
    console.log('   Generando SEARCH para', model.modelName);
    model.schema.paths._id.options.hideInForm = true;
    model.schema.paths.__v.options.hideInForm = true;
    if (model.schema.paths.createdAt) model.schema.paths.createdAt.options.hideInForm = true;
    if (model.schema.paths.updatedAt) model.schema.paths.updatedAt.options.hideInForm = true;
    try {
        for (const key in model.schema.paths) {
            if (Object.hasOwnProperty.call(model.schema.paths, key)) {
                const element = model.schema.paths[key];
                if (element.options.hideInForm) delete model.schema.paths[key]
            }
        }
        var text = await ejs.renderFile('./core/builder/templates/search.ejs', {model:model, params:params})
        fs.writeFile(`${basedir}/views/${params.view}/${model.modelName.toLowerCase()}-search.ejs`, cleanText(text), (err) => {if (err) throw err;})
    }
    catch (err) {
        console.error(err);
    }
}

function cleanText(text) {
    var arr = text.split('\r\n')
    var arrClean = arr.filter(a => a.replace(/[^\x20-\x7E]/g, '').trim() != '')
    return arrClean.join('\r\n')
}