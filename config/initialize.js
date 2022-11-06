const Users = require("../models/user.model");
const Apps = require("../models/app.model");
const { initializeDB } = require("./db.config");
const valueModel = require("../models/value.model");

const core_applications = [
    {name: 'home', type: ['side'], roles:['admin', 'user', 'public'], level:-1, link:'/', icon:'mdi mdi-home', parent:'admin'},
    {name: 'apps', type: ['action'], roles:['admin'], level:-1, link:'/admin/app-list', icon:'mdi mdi-apps', parent:'admin'},
    {name: 'users', type: ['action'], roles:['admin'], level:-1, link:'/admin/user-list', icon:'fas fa-users', parent:'admin'},
    {name: 'configs', type: ['action'], roles:['admin'], level:-1, link:'/admin/config-list', icon:'mdi mdi-pencil', parent:'admin'},
    {name: 'features', type: ['action'], roles:['admin'], level:-1, link:'/admin/feature-list', icon:'mdi mdi-image-filter-vintage', parent:'admin'},
    {name: 'values', type: ['action'], roles:['admin'], level:-1, link:'/admin/value-list', icon:'mdi mdi-numeric', parent:'admin'},
    {name: 'permissions', type: ['action'], roles:['admin'], level:-1, link:'/admin/permission-list', icon:'mdi mdi-account-key', parent:'admin'},
    {name: 'profile', type: ['user'], roles:['admin', 'user', 'reader'], level:-1, link:'/private/profile', icon:'mdi mdi-account-card-details'},
    {name: 'change-password', type: ['user'], roles:['admin', 'user', 'reader'], level:-1, link:'/private/change-password', icon:'mdi mdi-key'},
]

const core_values = [
    {type: 'role', value: 'admin', text: 'admin', order : 0},
    {type: 'role', value: 'user', text: 'user', order : 1},
    {type: 'role', value: 'reader', text: 'reader', order : 2},
    {type: 'role', value: 'public', text: 'public', order : 3},
]

var local_apps = []
var local_values = []
try {
    local_apps = require('../../config/initialize').applications || []
    local_values = require('../../config/initialize').values || []
}
catch {}

const applications = [...core_applications, ...local_apps]
const values = [...core_values, ...local_values]

module.exports =  async function initalize () {
    initializeDB()

    // Inicializar aplicaciones
    var admin = await Apps.findOne({name : 'admin'})
    if (!admin) {
        admin = await Apps.create({name:'admin', type:['action'], roles:['admin'], level:-1, link:'/admin', icon:'mdi mdi-hexagon-multiple'})
    }
    
    applications.forEach(a => {
        Apps.findOne({name : a.name})
        .then(async app => {
            if (!app) {
                if (a.parent && a.parent == 'admin') a.parent = admin._id
                await Apps.create(a)
            }
        })
    })


    // Inicializar valores
    values.forEach(v => {
        valueModel.findOne(v)
        .then(async value =>{
            if(!value) {
                await valueModel.create(v)
            }
        } )
    })
}