const express = require('express')
    const router = express.Router();
    const controller = require("../controllers/permission.controller");
    const authentication = require('../middlewares/authentication')
    const authorization = require('../middlewares/authorization')
    
    router.get("/", controller.getAll);
    router.get("/:id", controller.get);
    router.put("/:id", controller.update);
    router.post("/", controller.create);
    router.delete("/:id", controller.delete);
    
    router.post('/:id', (req, res) => { res.status(404).send({ message : 'Operation not supported'})})
    router.put('/', (req, res) => { res.status(404).send({ message : 'Operation not supported'})})
    router.delete('/', (req, res) => { res.status(404).send({ message : 'Operation not supported'})})
    
    
    module.exports = router;