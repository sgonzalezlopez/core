const {config} = require("../config/config");
const { sendTestEmail, sendTemplatedEmail } = require("../config/email.config");
const Model = require("../models/feature.model");

exports.getAll = (req, res) => {
    Model.find()
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
    Model.create(req.body)
    .then(item => {
        res.send(item)
    })
}

exports.update = (req, res) => {
    Model.findOneAndUpdate({_id:req.params.id}, req.body)
    .then(item => {
        if (item) res.send(item)
        else res.status(400).send({message: res.__('ITEM_NOT_FOUND')})
    })
}

exports.delete = (req, res) => {
    Model.deleteOne({_id:req.params.id})
    .then(users => {
        res.send({message : 'OK'})
    })
}