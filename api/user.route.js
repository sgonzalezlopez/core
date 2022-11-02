const express = require('express')
const router = express.Router();
const controller = require("../controllers/user.controller");
const authentication = require('../middlewares/authentication')
const authorization = require('../middlewares/authorization')

router.get("/", [authorization.isAdmin], controller.getAll);
router.get("/:id", [authorization.isAdmin], controller.get);
router.put("/:id", [authorization.isAdmin], controller.update);
router.post("/", [authorization.isAdmin], controller.create);
router.delete("/:id", [authorization.isAdmin], controller.delete);

router.post('/:id', (req, res) => { res.status(404).send({ message : 'Operation not supported'})})
router.put('/', (req, res) => { res.status(404).send({ message : 'Operation not supported'})})
router.delete('/', (req, res) => { res.status(404).send({ message : 'Operation not supported'})})


module.exports = router;