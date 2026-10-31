const Model = require("../models/permission.model");

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
        await Model.findOneAndUpdate({_id:req.params.id}, parseBody(req.body))
        .then(async item => {
            if (item) res.send(item)
            else res.status(400).send({message: res.__('ITEM_NOT_FOUND')})
        })
    } catch (err) {
        return next(err)
    }
}

exports.delete = async (req, res, next) => {
    try {
        await Model.deleteOne({_id:req.params.id})
        .then(async item => {
            res.send({message : 'OK'})
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
        .then(async items => {
            res.send(items)
        })
    } catch (err) {
        return next(err)
    }
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
