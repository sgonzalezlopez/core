const Users = require("../models/user.model");
const path = require("path")
const Apps = require("../models/app.model");
const { initializeDB } = require("./db.config");
const valueModel = require("../models/value.model");
const appConfigs = require("../config/app.config");
const featureModel = require("../models/feature.model");
const configModel = require("../models/config.model");

const core_applications = [
    {name: 'home', type: ['side'], roles:['admin', 'user', 'public'], level:-1, link:'/', icon:'mdi mdi-home'},
    {name: 'admin', type: ['action'], roles:['admin'], level:-1, link:'/admin/app-list', icon:'mdi mdi-hexagon-multiple'},
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
    {type: 'appPosition', value: 'side', text: 'Menu lateral', order : 1},
    {type: 'appPosition', value: 'action', text: 'Menu superior', order : 2},
    {type: 'appPosition', value: 'user', text: 'Menu de usuario', order : 3},
    {type: 'appPosition', value: 'main', text: 'Menu principal', order : 4},
    {type: 'permission', value: 'C', text: 'Create', order : 1},
    {type: 'permission', value: 'R', text: 'Read', order : 2},
    {type: 'permission', value: 'U', text: 'Update', order : 3},
    {type: 'permission', value: 'D', text: 'Delete', order : 4},
]

const core_features = appConfigs.FEATURES
const core_configs = appConfigs.CONFIGS

var local_apps = []
var local_values = []
var local_features = []
var local_configs = []
try {
    const local_config = require('../../config/initialize')
    local_apps = local_config.applications || []
    local_values = local_config.values || []
    local_features = local_config.features || []
    local_configs = local_config.configs || []
}
catch {}

const applications = [...core_applications, ...local_apps]
const values = [...core_values, ...local_values]
const features = {...core_features, ...local_features}
const configs = {...core_configs, ...local_configs}

module.exports =  async function initalize () {
    await initializeDB()

    await loadDefaultValues()


    // Features
    for (const key in features) {
        if (Object.hasOwnProperty.call(features, key)) {
            const element = features[key];
            featureModel.findOne({key : key})
            .then(item => {
                if (!item) featureModel.create({key:key, active:element})
            })
        }
    }

    // Configs
    for (const key in configs) {
        if (Object.hasOwnProperty.call(configs, key)) {
            const element = configs[key];
            configModel.findOne({key : key})
            .then(item => {
                if (!item) configModel.create({key:key, value:element})
            })
        }
    }
}

async function loadDefaultValues() {
        // Inicializar aplicaciones
        var admin = await Apps.findOne({name : 'admin'})
        if (!admin) {
            admin = await Apps.create({name:'admin', type:['action'], roles:['admin'], level:-1, link:'/admin/', icon:'mdi mdi-hexagon-multiple'})
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