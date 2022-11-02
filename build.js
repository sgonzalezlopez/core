const fs = require('fs');
const path = require('path');
var routes = null
const default_params = {
    generateForm : true,
    generateList : true,
    view : "",
}

function build(originDir) {
    args = process.argv.slice(2)
    args.map(e => {
        if (!e.startsWith('--')) originDir = e
    })

    basedir = path.resolve(originDir) + "/"

    console.log(args);

    console.log('Buscando entidades en ', basedir);
    var models = fs.readdirSync(basedir + '/models')
    var apis = fs.readdirSync(basedir + '/api')
    var controllers = fs.readdirSync(basedir + '/controllers')

    routes_file = basedir + '/api/routes.js'
    if (fs.existsSync(routes_file)) routes = fs.readFileSync(routes_file, 'utf-8').split('\r\n')
    
    models.map(m => {
        console.log(m);
        var model = m.split('.')[0]
        console.log('Ruta:', m, 'Model:', model);
        try {
            params = JSON.parse(fs.readFileSync(basedir + 'models/' + m, 'utf-8').split('\r\n')[0].replace('//', '').trim())
        }
        catch(err) {
            params = {}
        }
        params = {...default_params, ...params}
        console.log('Parametros de entidad:', params);



        if (!apis.includes(`${model}.route.js`) || args.includes('--force')) generateRouteFile(basedir, model)
        if (!controllers.includes(`${model}.controller.js`) || args.includes('--force')) generateControllerFile(basedir, model)

        if (!routes.some(element => {
            return (element.search('require') >= 0 && element.search(`'./${model}.route'`) >= 0)
        })) addRoute(model)

        if (params.generateForm) {
            if (!fs.existsSync(`${basedir}/views/${params.view}/${model}.ejs`) || args.includes('--force') || args.includes('--forceUI') || args.includes('--forceForms')) generateFormFile(basedir, model)
        }

        if (params.generateList) {
            if (!fs.existsSync(`${basedir}/views/${params.view}/${model}-list.ejs`) || args.includes('--force') || args.includes('--forceUI') ||  args.includes('--forceList')) generateListFile(basedir, model, params.view)
        }
    })
    fs.writeFile(routes_file, routes.join('\r\n'), (err) => {    
        if (err) throw err;
    })
}

build()

function addRoute(model) {
    var i = routes.indexOf('// Routes')
    routes.splice(i+1, 0, `router.use('/${model}', require('./${model}.route'))`)
}

function generateListFile(basedir, model, view) {
    console.log('Generando UI_LIST para', model);
    fs.writeFile(`${basedir}/views/${params.view}/${model}-list.ejs`, getList(view, model), (err) => {

        if (err) throw err;
    })
}
function generateFormFile(basedir, model) {
    console.log('Generando UI_FORM para', model);
    fs.writeFile(`${basedir}/views/${params.view}/${model}.ejs`, getForm(model), (err) => {
        if (err) throw err;
    })
}

function generateRouteFile(basedir, model) {
    console.log('Generando API para', model);
    fs.writeFile(`${basedir}/api/${model}.route.js`, getRoute(model), (err) => {
        if (err) throw err;
    })
}

function generateControllerFile(basedir, model) {
    console.log('Generando CONTROLLER para', model);
    fs.writeFile(`${basedir}/controllers/${model}.controller.js`, getController(model), (err) => {
        if (err) throw err;
    })
}

function getList(view, model) {
    return `<link rel="stylesheet" href="https://unpkg.com/bootstrap-table@1.21.1/dist/bootstrap-table.min.css">
    <div class="card">
        <div class="card-body">
            <h5 class="card-title">${model}</h5>
            <div class="table-responsive">
                <table id="table" data-toggle="table" data-url="/api/${model}" class="table table-striped table-bordered">
                <thead>
                    <tr>
                        <!--<th data-field="username"><%= __('COL_Username') %></th>-->
                        <th data-field="id" data-formatter="actionFormatter" data-events="actionEvents"><%= __('COL_actions') %></th>
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
        '<a class="view" href="/${view}/${model}' + row._id + '" title="">',
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
                url: \`/api/${model}/\${row._id}\`,
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
}


function getForm(model) {
    return `<div class="container-fluid">
    <%- include('../core/views/partials/form.ejs', {formName :'${model}Form', api:'/api/${model}'})%>
</div>`
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