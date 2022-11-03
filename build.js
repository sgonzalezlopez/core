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

build()

function processEntity(entity) {
    var model = entity
    console.log('Procesando Model:', model);
    try {
        params = JSON.parse(fs.readFileSync(basedir + 'models/' + entity + '.model.js', 'utf-8').split('\r\n')[0].replace('//', '').trim())
    }
    catch(err) {
        params = {}
    }
    params = {...default_params, ...params}
    console.log('   Parametros de entidad:', JSON.stringify(params));

    if (!apis.includes(`${model}.route.js`) || argv.force) generateRouteFile(basedir, model)
    if (!controllers.includes(`${model}.controller.js`) || argv.force) generateControllerFile(basedir, model)

    if (!routes.some(element => {
        return (element.search('require') >= 0 && element.search(`'./${model}.route'`) >= 0)
    })) addRoute(model)

    if (params.generateForm) {
        if (!fs.existsSync(`${basedir}/views/${params.view}/${model}.ejs`) || argv.force || argv.forceUI || argv.forceForm) generateFormFile(basedir, model, params)
    }

    if (params.generateList) {
        if (!fs.existsSync(`${basedir}/views/${params.view}/${model}-list.ejs`) || argv.force || argv.forceUI || argv.forceList) generateListFile(basedir, model, params)
    }

}

function addRoute(model) {
    var i = routes.indexOf('// Routes')
    routes.splice(i+1, 0, `router.use('/${model}', require('./${model}.route'))`)
}

function generateListFile(basedir, model, view) {
    console.log('   Generando UI_LIST para', model);
    fs.writeFile(`${basedir}/views/${params.view}/${model}-list.ejs`, getList(view, model), (err) => {

        if (err) throw err;
    })
}
function generateFormFile(basedir, model, params) {
    console.log('   Generando UI_FORM para', model);
    fs.writeFile(`${basedir}/views/${params.view}/${model}.ejs`, params.generateFullForm ? getFullForm(model) : getForm(model), (err) => {
        if (err) throw err;
    })
}

function generateRouteFile(basedir, model) {
    console.log('   Generando API para', model);
    fs.writeFile(`${basedir}/api/${model}.route.js`, getRoute(model), (err) => {
        if (err) throw err;
    })
}

function generateControllerFile(basedir, params) {
    model = params.view
    console.log('   Generando CONTROLLER para', model);
    fs.writeFile(`${basedir}/controllers/${model}.controller.js`, getController(model), (err) => {
        if (err) throw err;
    })
}

function getList(view, modelName) {

    const model = require(basedir + "models/" + modelName + '.model')
    model.schema.paths.createdAt.options.hideInForm = true;
    model.schema.paths.updatedAt.options.hideInForm = true;
    model.schema.paths._id.options.hideInForm = true;
    model.schema.paths.__v.options.hideInForm = true;

    var text = `<link rel="stylesheet" href="https://unpkg.com/bootstrap-table@1.21.1/dist/bootstrap-table.min.css">
    <div class="card">
        <div class="card-body">
            <h5 class="card-title">${modelName}</h5>
            <div class="table-responsive">
                <table id="table" data-toggle="table" data-url="/api/${modelName}" class="table table-striped table-bordered">
                <thead>
                    <tr>`
    Object.keys(model.schema.paths).forEach(element => { var path = model.schema.paths[element]
        if (!path.options.hideInForm) {
            text += `                <th data-field="${path.path}"><%= __('COL_${path.path}') %></th>`
        }
    })
    text += `                        <th data-field="id" data-formatter="actionFormatter" data-events="actionEvents"><%= __('COL_actions') %></th>
                    </tr>
                </thead>
            </table>
        </div>
    </div>
    </div>
    </div>
    
    <script src="https://unpkg.com/bootstrap-table@1.21.1/dist/bootstrap-table.min.js"></script>
    
    <script>
    function actionFormatter(value, row, index) {
      return [
        '<a class="view" href="/${view}/${modelName}' + row._id + '" title="">',
        '<i class="fa fa-eye"></i>',
        '</a> ',
        '<a class="delete" href="javascript:void(0)" title="">',
            '<i class="fa fa-trash"></i>',
            '</a> ',        
      ].join('');
    }
    
    window.actionEvents = {    
      'click .delete' : function (e, value, row, index) {
        e.stopPropagation()
        $.ajax({
                type: 'DELETE',
                url: \`/api/${modelName}/\${row._id}\`,
                dataType: 'json',
                success: function(data) {
                    toastr.success("<%= __('APP_NAME') %>", "<%= __('DELETE_SUCCESS') %>")
                    $('#table').bootstrapTable('refresh')
                },
                error: function(error) {
                    console.log('error');
                    console.error(error);
                },
            });
      },
    }
    </script>`
    return text;
}


function getForm(model) {
    return `<div class="container-fluid">
    <%- include('../core/views/partials/form.ejs', {formName :'${model}Form', api:'/api/${model}'})%>
</div>`
}

function getFullForm(modelName) {
    const model = require(basedir + "models/" + modelName + '.model')
    model.schema.paths.createdAt.options.readOnly = true;
    model.schema.paths.updatedAt.options.readOnly = true;
    model.schema.paths._id.options.hideInForm = true;
    model.schema.paths.__v.options.hideInForm = true;

    formName = modelName + 'Form';

    var text =""
    text += `<html>
        <head>
            <link rel="stylesheet" type="text/css" href="/assets/libs/select2/dist/css/select2.min.css" />
            <link rel="stylesheet" type="text/css" href="/assets/libs/bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css"/>        
        </head>
    <body>
        <div class="row">
            <div class="col-md-12">
                <div class="card">
                    <form id="${formName}" class="form-horizontal">
                        <div class="card-body">
                            <h4 class="card-title"><%= __('MODEL_${modelName}') %></h4>`;
    
    Object.keys(model.schema.paths).forEach(element => { var path = model.schema.paths[element]
        if (!path.options.hideInForm) {
            text += `
                                <div class="form-group row">
                                    <label for="${path.path}" class="col-sm-3 text-end control-label col-form-label"><%= __('MODEL_${modelName}_${path.path}') %></label>
                                    <div class="col-sm-9">`
            if (path.options.combo && path.options.combo.multiple) {
                text += `                                        <select id="${path.path}" name="${path.path}" class="select2 form-select shadow-none" multiple="multiple" style="width: 100%; height: 36px" ${path.options.readOnly ? 'disabled' : ''}>`
                text += `                                        <% model.schema.paths['${element}'].options.combo.values.forEach(v => { %>
                    <option <%= locals.object && object['${element}'].includes(v.value) ? 'selected' : '' %> value="<%=v.value%>"><%=v.text%></option>
                <% }) %>`
                text += `</select>`
            }
            else if (path.options.combo) {
                text += `<select id="${path.path}" name="${path.path}" class="select2 form-select shadow-none" style="width: 100%; height: 36px" ${ path.options.readOnly ? 'disabled' : ''} >
                    <option value=""></option>
                    <% model.schema.paths['${element}'].options.combo.values.forEach(v => { %>
                        <option <%= locals.object && object['${element}'] == v.value ? 'selected' : '' %> value="<%=v.value%>"><%=v.text%></option>
                    <% }) %>`
                text += `</select>`
            }
            else if (path.options.type.name == 'Boolean') {
                text += `<select id="${path.path}" name="${path.path}" class="select2 form-select shadow-none" style="width: 100%; height: 36px" ${path.options.readOnly ? 'disabled' : ''}>
                    <option <%= locals.object && object['${element}'] ? 'selected' : '' %> value="true"><%= __('BOOLEAN_true') %></option>
                    <option <%= locals.object && !object['${element}'] ? 'selected' : '' %> value="false"><%= __('BOOLEAN_false') %></option>
                </select>` 
            }
            else if (path.options.type.name == 'Date') {
                text += `<div class="input-group">
                    <input type="text" class="form-control mydatepicker" placeholder="<%=__('DATE_FORMAT')%>" id="${path.path}" name="${path.path}" ${path.options.readOnly ? 'disabled' : ''} value="<%= locals.object ? object['${element}'] : '' %>" />
                    <div class="input-group-append">
                        <span class="input-group-text h-100"><i class="mdi mdi-calendar"></i></span>
                    </div>
                </div>`
            }
            else if (path.options.type.name == 'Number') {
                text += `<input type="number" class="form-control" id="${path.path}" name="${path.path}" placeholder="" ${path.options.readOnly ? 'disabled' : ''} value="<%= locals.object ? object['${element}'] : '' %>"/>`
            }
            else if (path.options.password) {
                text += `<input type="password" class="form-control" id="${path.path}" name="${path.path}" placeholder="" ${path.options.readOnly ? 'disabled' : ''} value="<%= locals.object ? object['${element}'] : '' %>"/>`
            }
            else if (path.options.fileUpload) {
                text += `<div class="custom-file">
                <input type="file" class="custom-file-input" id="${path.path}" name="${path.path}" required />
                </div>`
            } else {
                text += `<input type="text" class="form-control" id="${path.path}" name="${path.path}" placeholder="" ${path.options.readOnly ? 'disabled' : ''} value="<%= locals.object ? object['${element}'] : '' %>"/>`
            }
            text += `                                    </div>
            </div> `
        }
    })
    text += `
    <div class="border-top">
    <div class="card-body">
        <button id="${formName}_submit_btn" type="button" class="btn btn-primary"><%= __('SAVE') %></button>
        <button id="${formName}_list_btn" type="button" class="btn btn-info"><%= __('LIST') %></button>
    </div>
</div>
</form>
</div>

<script src="/assets/libs/inputmask/dist/min/jquery.inputmask.bundle.min.js"></script>
<script src="/dist/js/pages/mask/mask.init.js"></script>
<script src="/assets/libs/select2/dist/js/select2.full.min.js"></script>
<script src="/assets/libs/select2/dist/js/select2.min.js"></script>
<script src="/assets/libs/bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js"></script>
<script src="/assets/libs/bootstrap-datepicker/dist/locales/bootstrap-datepicker.es.min.js"></script>
<script>
    //***********************************//
    // For select 2
    //***********************************//
    $(".select2").select2();
    
    /*datwpicker*/
    jQuery(".mydatepicker").datepicker({
        language: '<%=__("LANGUAGE")%>',
        todayHighlight: true,
    });
    jQuery("#datepicker-autoclose").datepicker({
        language: '<%=__("LANGUAGE")%>',
        autoclose: true,
        todayHighlight: true,
    });

    jQuery('#${formName}_submit_btn').click(() => {
        var data = $('#${formName}').serialize();
        $.ajax({
            type: '<%= locals.object ? "PUT" : "POST" %>',
            url: '/api/${modelName}/<%= locals.object ? object._id : "" %>',
            data: data,
            dataType: 'json',
            success: function(data) {
                toastr.success("<%= __('SAVE_SUCCESS') %>", "<%= __('APP_NAME') %>")
            },
            error: function(error) {
                console.error(error);
                toastr.error("<%= __('SAVE_ERROR') %>", "<%= __('APP_NAME') %>")
            },
        });
    })

    $('#${formName}_list_btn').click(() => {
        window.location.replace('/${modelName}-list')
    })
</script>
</body>
</html>`

return text;
}


function getRoute(model) {
    return `const express = require('express')
    const router = express.Router();
    const controller = require("../controllers/${model}.controller");
    const authentication = require('../core/middlewares/authentication')
    const authorization = require('../core/middlewares/authorization')
    
    router.get("/", controller.getAll);
    router.get("/:id", controller.get);
    router.put("/:id", controller.update);
    router.post("/", controller.create);
    router.delete("/:id", controller.delete);
    
    router.post('/:id', (req, res) => { res.status(404).send({ message : 'Operation not supported'})})
    router.put('/', (req, res) => { res.status(404).send({ message : 'Operation not supported'})})
    router.delete('/', (req, res) => { res.status(404).send({ message : 'Operation not supported'})})
    
    
    module.exports = router;`
}

function getController(model) {
    return `const Model = require("../models/${model}.model");

    exports.getAll = (req, res) => {
        Model.find()
        .then(items => {
            res.send(items)
        })
    }
    
    exports.get = (req, res) => {
        Model.findById(req.params.id)
        .then(item => {
            res.send(item)
        })
    }
    
    exports.create = (req, res) => {
        Model.create(req.body)
        .then(item => {
            res.send(item)
        })
    }
    
    exports.update = (req, res) => {
        Model.findOneAndUpdate({_id:req.params.id}, req.body)
        .then(item => {
            if (item) res.send(item)
            else res.status(400).send({message: res.__('ITEM_NOT_FOUND')})
        })
    }
    
    exports.delete = (req, res) => {
        Model.deleteOne({_id:req.params.id})
        .then(users => {
            res.send({message : 'OK'})
        })
    }`
}