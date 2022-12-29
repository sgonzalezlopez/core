const express = require('express')
const router = express.Router();
const path = require('path')
const authentication = require(path.join(__corePath, '/middlewares/authentication'))
const authorization = require(path.join(__corePath, '/middlewares/authorization'))


// Routes


module.exports = router;