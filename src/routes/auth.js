const router = require("express").Router();
const { register, registerValidators, login, loginValidators } = require("../controllers/authController");

router.post("/register", registerValidators, register);
router.post("/login", loginValidators, login);

module.exports = router;