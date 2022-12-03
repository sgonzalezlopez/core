const express = require('express')
const router = express.Router();
const authentication = require('../middlewares/authentication')
const authorization = require('../middlewares/authorization')
const apps = require('../controllers/app.controller')
const { getFeature } = require('../config/config');
const { db } = require('../models/config.model');
const i18n = require('../i18n/i18n.config')
const fs = require('fs');
const configs = require('../../config/app.config');
const moment = require('moment')

module.exports.renderWithApps = function (req, res, next, view, data) {
    this.renderWithApps(req, res, next, view, data, id)
}

module.exports.renderWithApps = async function renderWithApps(req, res, next, view, data, id) {
    var modelName = view.split('/').pop().split('-')[0]
    var viewBase = view.split('-')[0]


    if (!data || data == null) data = {actions : null};
    data.user = req.user;

    data.config = configs
    data.moment = moment

    if (await getFeature('ALWAYS_REFRESH_MENU')) data.apps = await apps.getApplications(req.user)
    else data.apps = req.session.apps || await apps.getApplications(req.user)
    req.session.apps = data.apps

    // data.apps = await apps.getApplications(req.user)
    data.sideApps = data.apps.filter(a => a.type.includes('side'))
    data.actionApps = data.apps.filter(a => a.type.includes('action'))
    data.userApps = data.apps.filter(a => a.type.includes('user'))
    data.mainApps = data.apps.filter(a => a.type.includes('main'))
    data.permissions = await authorization.getPermissionsForEntity(modelName, data.user)
    // data.view = view;
    console.log(data.apps.filter(a => a.link == ("/" + view)));
    data.currentApp = data.apps.filter(a => a.link == ("/" + view))[0]


    try {
        var model_path = fs.existsSync(`./models/${modelName}.model.js`) ? `../../models/${modelName}.model` : `../models/${modelName}.model`
        var model = await require(model_path)
        var props = Object.keys(model.schema.paths)
        
        if (model) {

            props.forEach(async path => {
                p = model.schema.paths[path];
                if (p.options.combo && p.options.combo.collection) p.options.combo.values = await getValues(p.options.combo.collection.name, p.options.combo.collection.text)
                else if (p.options.combo && p.options.combo.type) p.options.combo.values = await getType(p.options.combo.type)
            })


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

async function getValues(name, text) {
    val = await db.model(name).find();
    val.map(a => {
        a.value = a._id;
        a.text = a[text];
    })

    return val

}

async function getType(type) {
    val = await db.model('Value').find({type:type}).sort('order');
    val.map(v => {
        if (!v.text) v.text = i18n.__(`VAL_${v.value}`)
    })
    return val

}