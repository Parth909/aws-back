const express = require("express");
const router = express.Router();

// Middleware
const {
  requireSignIn,
  authMiddleware,
  adminMiddleware,
} = require("../controllers/auth");

// requireSignIn, authMiddleware, - loggedIn users only
// requireSignIn, authMiddleware, adminMiddleware - admin only
const { userUpdateValidator } = require("../validators/auth");
const { runValidation } = require("../validators");
// Controllers
const { readProfile, updateProfile } = require("../controllers/user");

// routes
router.get("/user", requireSignIn, authMiddleware, readProfile);
router.get("/admin", requireSignIn, adminMiddleware, readProfile);
router.put(
  "/user",
  userUpdateValidator,
  runValidation,
  requireSignIn,
  authMiddleware,
  updateProfile
);

module.exports = router;
