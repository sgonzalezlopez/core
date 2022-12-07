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
    else {
        data.apps =  (req.session.hasOwnProperty('apps') && req.session.apps[0].hasOwnProperty('child')) ? req.session.apps : await apps.getApplications(req.user)
    }

    req.session.apps = data.apps

    data.sideApps = data.apps.filter(a => a.type.includes('side'))
    data.actionApps = data.apps.filter(a => a.type.includes('action'))
    data.userApps = data.apps.filter(a => a.type.includes('user'))
    data.mainApps = data.apps.filter(a => a.type.includes('main'))
    data.permissions = await authorization.getPermissionsForEntity(modelName, data.user)
    data.currentApp = data.apps.filter(a => a.link == ("/" + view))[0]
    data.object = null;
    data.view = view

    try {
        var model_path = fs.existsSync(`./models/${modelName}.model.js`) ? `../../models/${modelName}.model` : `../models/${modelName}.model`
        var controller_path = fs.existsSync(`./controllers/${modelName}.controller.js`) ? `../../controllers/${modelName}.controller` : `../controllers/${modelName}.controller`
        var model = await require(model_path)
        var controller = await require(controller_path)

        if (model) {
            data.model = model
            data.list = viewBase + '-list'
            data.search = viewBase + '-search'
            data.detail = data.permissions.includes('C') ? viewBase : null
        }

        if (id && controller.hasOwnProperty('getObject')) data.object = await controller.getObject(id, req.user)
        else if (id) data.object = await model.findById(id)

        if (id && data.object == null) throw (new Error(i18n.__('OBJECT_NOT_FOUND')))
        else res.render(view, data);
    }
    catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') res.render(view, data);
        else {
            console.error(err);
            next(err, null);
        }
    }
}