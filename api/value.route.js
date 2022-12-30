const express = require('express')
const router = express.Router();
const path = require('path')
const controller = require("../controllers/value.controller");
const authentication = require(path.join(__corePath, '/middlewares/authentication'))
const authorization = require(path.join(__corePath, '/middlewares/authorization'))

router.get("/", authorization.checkPermision('value', 'R'), controller.getAll);
router.get("/:id", authorization.checkPermision('value', 'R'), controller.get);
router.post("/find", authorization.checkPermision('value', 'R'), controller.find);
router.put("/:id", authorization.checkPermision('value', 'U'), controller.update);
router.post("/", authorization.checkPermision('value', 'C'), controller.create);
router.delete("/:id", authorization.checkPermision('value', 'D'), controller.delete);

router.post('/:id', (req, res) => { res.status(404).send({ message: 'Operation not supported' }) })
router.put('/', (req, res) => { res.status(404).send({ message: 'Operation not supported' }) })
router.delete('/', (req, res) => { res.status(404).send({ message: 'Operation not supported' }) })


module.exports = router;