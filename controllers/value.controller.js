const Model = require("../models/value.model");

exports.getAll = (req, res) => {
    Model.find()
        .sort({ type: 1, order: 1 })
        .then(items => {
            res.send(items)
        })
}

exports.get = (req, res) => {
    Model.findById(req.params.id)
        .then(item => {
            res.send(item)
        })
}

exports.create = (req, res) => {
    Model.create(parseBody(req.body))
        .then(item => {
            res.send(item)
        })
}

exports.update = (req, res) => {
    Model.findOneAndUpdate({ _id: req.params.id }, parseBody(req.body))
        .then(item => {
            if (item) res.send(item)
            else res.status(400).send({ message: res.__('ITEM_NOT_FOUND') })
        })
}

exports.delete = (req, res) => {
    Model.deleteOne({ _id: req.params.id })
        .then(item => {
            res.send({ message: 'OK' })
        })
}

exports.find = (req, res) => {
    for (const key in req.body) {
        if (Object.hasOwnProperty.call(req.body, key)) {
            if (req.body[key] == '') delete req.body[key]
        }
    }
    Model.find(req.body)
        .sort({ type: 1, order: 1 })
        .then(items => {
            res.send(items)
        })
}

exports.getValues = (key) => {
    return Model.find({ type: key })
        .sort({ type: 1, order: 1 })
        .then(items => {
            if (!items) items = []
            return items
        })
        .catch(e => {
            console.error(e);
            return []
        })
}

function parseBody(body) {
    var values = body
    for (const key in body) {
        if (Object.hasOwnProperty.call(body, key)) {
            values[key] = body[key] == "" ? null : body[key];
        }
    }

    return values;
}