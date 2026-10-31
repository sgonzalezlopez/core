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
    if (__initialization) {
        __initialization.forEach(init => {
            const local_config = require(init)
            local_apps = [...local_apps, ...local_config.applications || []]
            local_values = [...local_values, ...local_config.values || []]
            local_features = [...local_features, ...local_config.features || []]
            local_configs = [...local_configs, ...local_config.configs || []]
        });
    }
}
catch {}

const applications = [...core_applications, ...local_apps]
const values = [...core_values, ...local_values]
const features = {...core_features, ...local_features}
const configs = {...core_configs, ...local_configs}

module.exports = async function initialize() {
    await initializeDB();
    await loadDefaultValues();
    for (const [key, active] of Object.entries(features)) {
        if (!await featureModel.findOne({key})) await featureModel.create({key, active});
    }
    for (const [key, value] of Object.entries(configs)) {
        if (!await configModel.findOne({key})) await configModel.create({key, value});
    }
    const {loadConfigs, loadFeatures} = require('./config');
    await Promise.all([loadConfigs(), loadFeatures()]);
};

async function loadDefaultValues() {
    let admin = await Apps.findOne({name: 'admin'});
    if (!admin) admin = await Apps.create({name: 'admin', type: ['action'], roles: ['admin'], level: -1, link: '/admin/', icon: 'mdi mdi-hexagon-multiple'});
    for (const application of applications) {
        if (!await Apps.findOne({name: application.name})) await Apps.create({...application, ...(application.parent === 'admin' ? {parent: admin._id} : {})});
    }
    for (const value of values) {
        if (!await valueModel.findOne(value)) await valueModel.create(value);
    }
}
