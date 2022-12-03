const express = require('express')
const router = express.Router();
const { verifySignUp, authorization, authentication, validateConfig } = require("../middlewares/middlewares");
const controller = require("../controllers/auth.controller");

router.post("/register", [validateConfig.checkFeature('SELF_REGISTER'), verifySignUp.checkInputData, verifySignUp.checkDuplicateUsernameOrEmail], controller.register);
router.post("/signup", [verifySignUp.checkInputData, verifySignUp.checkDuplicateUsernameOrEmail], controller.signup);
router.post("/reset", controller.resetPass);
router.post("/changepassword/:id", [authentication.isAuthenticated, verifySignUp.validateNewPassword], controller.changepassword);
router.post("/signin", controller.signin);


module.exports = router;