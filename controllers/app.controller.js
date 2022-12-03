const Apps = require("../models/app.model");

const applications = [
    {name: "Admin", title : 'APP_Admin', link: '/admin', roles: ['admin'], icon:'fas fa-bullseye'},
    {name: "Tools", title : 'APP_Tools', link: '/tools', roles: ['admin'], icon:'fas fa-bullseye'},
    {name: "Test", title : 'APP_Test', link: '/admin/test', roles: ['admin'], icon:'fas fa-bullseye'},
]

exports.getAll = (req, res) => {
    Apps.find()
    .populate('parent')
    .then(items => {
        res.send(items)
    })
}

exports.get = (req, res) => {
    Apps.findById(req.params.id)
    .populate('parent')
    .then(item => {
        res.send(item)
    })
}

exports.create = (req, res) => {
    Apps.create(req.body)
    .then(item => {
        res.status(200).send(item)
    })
    .catch(err => {
        console.error(err);
        res.status(400).send({msg: res.__('CREATE_ERROR')})
    })
}

exports.update = (req, res) => {
    Apps.findByIdAndUpdate(req.params.id, req.body)
    .then(item => {
        res.status(200).send({msg: res.__('UPDATE_OK')})
    })
    .catch(err => {
        console.error(err);
        res.status(400).send({msg: res.__('UPDATE_ERROR')})
    })
}

exports.delete = (req, res) => {
    Apps.findByIdAndDelete(req.params.id)
    .then(item => {
        res.status(200).send({msg: res.__('DELETE_OK')})
    })
    .catch(err => {
        console.error(err);
        res.status(400).send({msg: res.__('DELETE_ERROR')})
    })
}

exports.find = (req, res) => {
    for (const key in req.body) {
        if (Object.hasOwnProperty.call(req.body, key)) {
            if (req.body[key] == '') delete req.body[key]                
        }
    }
    Apps.find(req.body)
    .populate('parent')
    .then(items => {
        res.send(items)
    })
}


exports.getApplications = (user) => {
    console.log('Recuperando aplicaciones de BD');
    if (!user) user = {roles : ['public']}
    return Apps.find()
    .populate('parent')
    .sort('level')
    .then(items => {
        return items.filter(a => a.roles.some(r=> user.roles.includes(r)))
    })
    // return applications.filter(a => a.roles.some(r=> user.roles.includes(r)))
    // return applications.filter(a => checkRoles(a.roles, user.roles))
}

function checkRoles(a, b) {
    var resp = false
    b.forEach(element => {
        if (a.includes(element)) resp = true;
    });
    return resp;
}