const express = require('express')
    const router = express.Router();
    const controller = require("../controllers/<%=model.modelName.toLowerCase()%>.controller");
    const authentication = require('../core/middlewares/authentication')
    const authorization = require('../core/middlewares/authorization')
    
    router.get("/", authorization.checkPermision('<%=model.modelName.toLowerCase()%>', 'R'), controller.getAll);
    router.get("/:id", authorization.checkPermision('<%=model.modelName.toLowerCase()%>', 'R'), controller.get);
    router.post("/find", authorization.checkPermision('<%=model.modelName.toLowerCase()%>', 'R'), controller.find);
    router.put("/:id", authorization.checkPermision('<%=model.modelName.toLowerCase()%>', 'U'), controller.update);
    router.post("/", authorization.checkPermision('<%=model.modelName.toLowerCase()%>', 'C'), controller.create);
    router.delete("/:id", authorization.checkPermision('<%=model.modelName.toLowerCase()%>', 'D'), controller.delete);
    
    router.post('/:id', (req, res) => { res.status(404).send({ message : 'Operation not supported'})})
    router.put('/', (req, res) => { res.status(404).send({ message : 'Operation not supported'})})
    router.delete('/', (req, res) => { res.status(404).send({ message : 'Operation not supported'})})
    
    
module.exports = router;