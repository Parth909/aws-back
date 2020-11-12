const express = require("express");
const router = express.Router();

// Validators
const {
  userRegisterValidator,
  userLoginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validators/auth");

// validator functions to check if the validators are satisfied
const { runValidation } = require("../validators/index");

// Controllers
const {
  register,
  registerActivate,
  login,
  requireSignIn,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth");

router.post("/register", userRegisterValidator, runValidation, register);
router.post("/register/activate", registerActivate);

// Login route
router.post("/login", userLoginValidator, runValidation, login);
router.put(
  "/forgot-password",
  forgotPasswordValidator,
  runValidation,
  forgotPassword
);
router.put(
  "/reset-password",
  resetPasswordValidator,
  runValidation,
  resetPassword
);

module.exports = router;
