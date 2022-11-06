const express = require('express')
    const router = express.Router();
    const controller = require("../controllers/permission.controller");
    const authentication = require('../middlewares/authentication')
    const authorization = require('../middlewares/authorization')
    
    router.get("/", authorization.checkPermision('permission', 'R'), controller.getAll);
    router.get("/:id", authorization.checkPermision('permission', 'R'), controller.get);
    router.post("/find", authorization.checkPermision('permission', 'R'), controller.find);
    router.put("/:id", authorization.checkPermision('permission', 'U'), controller.update);
    router.post("/", authorization.checkPermision('permission', 'C'), controller.create);
    router.delete("/:id", authorization.checkPermision('permission', 'D'), controller.delete);
    
    router.post('/:id', (req, res) => { res.status(404).send({ message : 'Operation not supported'})})
    router.put('/', (req, res) => { res.status(404).send({ message : 'Operation not supported'})})
    router.delete('/', (req, res) => { res.status(404).send({ message : 'Operation not supported'})})
    
    
module.exports = router;