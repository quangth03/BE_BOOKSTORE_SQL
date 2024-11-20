const router = require("express").Router();
const userController = require("../controllers/user.controller");
const verifySignUp = require("../middlewares/verifySignUp");
const verify = require("../middlewares/authJwt").verifyToken_User;

module.exports = (app) => {

    // sign up
    router.post("/signup",[verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.registerValidator], userController.signup);

    // sign in
    router.post("/signin", userController.signin);

    // change password
    router.put("/changepassword", verify, userController.changePassword);
    router.post("/forgot-password", userController.forgotPassword);

    app.use('/auth', router);
}
