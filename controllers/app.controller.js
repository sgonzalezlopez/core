const Model = require("../models/app.model");

const applications = [
    { name: "Admin", title: 'APP_Admin', link: '/admin', roles: ['admin'], icon: 'fas fa-bullseye' },
    { name: "Tools", title: 'APP_Tools', link: '/tools', roles: ['admin'], icon: 'fas fa-bullseye' },
    { name: "Test", title: 'APP_Test', link: '/admin/test', roles: ['admin'], icon: 'fas fa-bullseye' },
]

exports.getAll = async (req, res, next) => {
    try {
        await Model.find()
            .then(async items => {
                res.send(items)
            })
    } catch (err) {
        return next(err)
    }
}

exports.get = async (req, res, next) => {
    try {
        await Model.findById(req.params.id)
            .then(async item => {
                res.send(item)
            })
    } catch (err) {
        return next(err)
    }
}

exports.create = async (req, res, next) => {
    try {
        await Model.create(parseBody(req.body))
            .then(async item => {
                res.send(item)
            })
    } catch (err) {
        return next(err)
    }
}

exports.update = async (req, res, next) => {
    try {
        await Model.findOneAndUpdate({ _id: req.params.id }, parseBody(req.body))
            .then(async item => {
                if (item) res.send(item)
                else res.status(400).send({ message: res.__('ITEM_NOT_FOUND') })
            })
    } catch (err) {
        return next(err)
    }
}

exports.delete = async (req, res, next) => {
    try {
        await Model.deleteOne({ _id: req.params.id })
            .then(async item => {
                res.send({ message: 'OK' })
            })
    } catch (err) {
        return next(err)
    }
}

exports.find = async (req, res, next) => {
    try {
        for (const key in req.body) {
            if (Object.hasOwnProperty.call(req.body, key)) {
                if (req.body[key] === '') delete req.body[key]
            }
        }
        await Model.find(req.body)
            .populate('parent')
            .then(async items => {
                res.send(items)
            })
    } catch (err) {
        return next(err)
    }
}


exports.getApplications = (user) => {
    console.log('Recuperando aplicaciones de BD');
    if (!user) user = { roles: ['public'] }
    return Model.find()
        .populate('parent')
        .sort('level')
        .then(async items => {
            var filtered = items.filter(a => a.roles.some(r => user.roles.includes(r)))
            var tree = filtered.filter(a => a.parent == null);
            tree.map(t => {
                t.child = filtered.filter(a => a.parent && a.parent.id == t._id)
            })

            return tree
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

function parseBody(body) {
    var values = body
    for (const key in body) {
        if (Object.hasOwnProperty.call(body, key)) {
            values[key] = body[key] === "" ? null : body[key];
        }
    }

    return values;
}
