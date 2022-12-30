const express = require('express')
const router = express.Router();
const path = require('path')
const controller = require("../controllers/config.controller");
const authentication = require(path.join(__corePath, '/middlewares/authentication'))
const authorization = require(path.join(__corePath, '/middlewares/authorization'))

router.get("/", [authorization.isAdmin], controller.getAll);
router.get("/:id", [authorization.isAdmin], controller.get);
router.post("/find", [authorization.isAdmin], controller.find);
router.put("/:id", [authorization.isAdmin], controller.update);
router.post("/", [authorization.isAdmin], controller.create);
router.delete("/:id", [authorization.isAdmin], controller.delete);

router.post('/:id', (req, res) => { res.status(404).send({ message: 'Operation not supported' }) })
router.put('/', (req, res) => { res.status(404).send({ message: 'Operation not supported' }) })
router.delete('/', (req, res) => { res.status(404).send({ message: 'Operation not supported' }) })


module.exports = router;