const express = require('express')
const router = express.Router();
const { verifySignUp, authorization, authentication, validateConfig } = require("../middlewares/middlewares");
const controller = require("../controllers/auth.controller");

router.post("/register", [validateConfig.checkFeature('SELF_REGISTER'), verifySignUp.checkInputData, verifySignUp.checkDuplicateUsernameOrEmail], controller.register2);
router.post("/signup", [verifySignUp.checkInputData, verifySignUp.checkDuplicateUsernameOrEmail], controller.signup);
router.post("/reset", [authorization.isAdmin], controller.resetPass);
router.post("/setpass/:id", [authorization.isAdmin], controller.setPassword);
router.post("/changepassword/:id", [authentication.isAuthenticated, verifySignUp.validateNewPassword], controller.changepassword);
router.post("/signin", controller.signin);


module.exports = router;