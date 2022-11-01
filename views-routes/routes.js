const express = require('express')
const router = express.Router();
const authentication = require('../middlewares/authentication')
const authorization = require('../middlewares/authorization')
const apps = require('../controllers/apps.controller')
const public = require('./public.route')
const admin = require('./admin.route');
const i18n = require('../i18n/i18n.config');
const { config } = require('../config/config');
const { db } = require('../models/config.model');

router.use('/admin', authorization.isAdmin, admin)
router.use('/', public)

module.exports = router;

module.exports.renderWithApps = function (req, res, next, view, data) {
    this.renderWithApps(req, res, next, view, data, id)
}

module.exports.renderWithApps = async function renderWithApps(req, res, next, view, data, id) {
    var modelName = view.split('/').pop().replace('-list', '')
    var viewBase = view.replace('-list', '')


    if (!data || data == null) data = {actions : null};
    data.user = req.user;

    if (await config.app.getFeature('ALWAYS_REFRESH_MENU')) data.apps = await apps.getApplications(req.user)
    else data.apps = req.session.apps || await apps.getApplications(req.user)
    req.session.apps = data.apps

    // data.apps = await apps.getApplications(req.user)
    data.sideApps = data.apps.filter(a => a.type.includes('side'))
    data.actionApps = data.apps.filter(a => a.type.includes('action'))
    data.userApps = data.apps.filter(a => a.type.includes('user'))
    data.mainApps = data.apps.filter(a => a.type.includes('main'))

    try {
        var model = await require(`../models/${modelName}.model`)
        var props = Object.keys(model.schema.paths)
        
        if (model) {

            props.forEach(async path => {
                p = model.schema.paths[path];
                if (p.options.combo && p.options.combo.collection) p.options.combo.values = await getValues(p.options.combo.collection.name, p.options.combo.collection.text)
                else if (p.options.combo && p.options.combo.type) p.options.combo.values = await getType(p.options.combo.type)
            })


            data.model = model
            data.list = viewBase + '-list'
            data.detail = viewBase
        }

        if (id) data.object = await model.findById(id)
    }
    catch (err) {
        if (err.code !== 'MODULE_NOT_FOUND') console.error(err);
    }
    finally {        
        res.render(view, data);
    }
}

async function getValues(name, text) {
    val = await db.model(name).find().select(`_id, ${text}`);
    val.map(a => {
        a.value = a._id;
        a.text = a[text];
    })

    return val

}

async function getType(type) {
    val = await db.model('Value').find({type:type}).sort('order');
    return val

}