const Model = require("../models/value.model");

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
        .then(item => {
            res.send({message : 'OK'})
        })
    }

    exports.find = (req, res) => {
        for (const key in req.body) {
            if (Object.hasOwnProperty.call(req.body, key)) {
                if (req.body[key] == '') delete req.body[key]                
            }
        }
        Model.find(req.body)
        .then(items => {
            res.send(items)
        })
    }