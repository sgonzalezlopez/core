const express = require('express')
const router = express.Router();
const authentication = require('../middlewares/authentication')
const authorization = require('../middlewares/authorization')
const apps = require('../controllers/app.controller')
const i18n = require('../i18n/i18n.config')
const fs = require('fs');
const config = require('../config/config');
const moment = require('moment')

module.exports.renderWithApps = function (req, res, next, view, data) {
    this.renderWithApps(req, res, next, view, data, id)
}

module.exports.renderWithApps = async function renderWithApps(req, res, next, view, data, id) {
    var modelName = view.split('/').pop().split('-')[0]
    var viewBase = view.split('-')[0]


    if (!data || data == null) data = { actions: null };
    data.user = req.user;

    data.config = config.getConfig()
    data.moment = moment
    if (config.getFeature('ALWAYS_REFRESH_MENU')) data.apps = await apps.getApplications(req.user)
    else (data.apps =  req.session.hasOwnProperty('apps') ? req.session.apps : await apps.getApplications(req.user))
    req.session.apps = data.apps




    // data.apps = await apps.getApplications(req.user)
    data.sideApps = data.apps.filter(a => a.type.includes('side'))
    data.actionApps = data.apps.filter(a => a.type.includes('action'))
    data.userApps = data.apps.filter(a => a.type.includes('user'))
    data.mainApps = data.apps.filter(a => a.type.includes('main'))
    data.permissions = await authorization.getPermissionsForEntity(modelName, data.user)
    data.currentApp = data.apps.filter(a => a.link == ("/" + view))[0]
    data.view = view

    try {
        var model_path = fs.existsSync(`./models/${modelName}.model.js`) ? `../../models/${modelName}.model` : `../models/${modelName}.model`
        var model = await require(model_path)

        if (model) {
            data.model = model
            data.list = viewBase + '-list'
            data.search = viewBase + '-search'
            data.detail = data.permissions.includes('C') ? viewBase : null
        }

        if (id) data.object = await model.findById(id)
    }
    catch (err) {
        if (err.code !== 'MODULE_NOT_FOUND') {
            console.error(err);
            throw err
        }
    }
    finally {
        res.render(view, data);
    }
}

// async function getValues(name, text) {
//     val = await db.model(name).find();
//     val.map(a => {
//         a.value = a._id;
//         a.text = a[text];
//     })

//     return val

// }

// async function getType(type) {
//     val = await db.model('Value').find({type:type}).sort('order');
//     val.map(v => {
//         if (!v.text) v.text = i18n.__(`VAL_${v.value}`)
//     })
//     return val

// }