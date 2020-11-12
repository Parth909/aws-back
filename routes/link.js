const express = require("express");
const router = express.Router();

// validators
const {
  linkCreateValidator,
  linkUpdateValidator,
} = require("../validators/link");

const { runValidation } = require("../validators");

const {
  requireSignIn,
  authMiddleware,
  adminMiddleware,
  canUpdateDeleteLink,
} = require("../controllers/auth");

// controllers
const {
  createLink,
  listLinks,
  readLink,
  updateLink,
  removeLink,
  clickCount,
  popular,
  popularinCategory,
} = require("../controllers/link");

// routes
// while using images with the help of form-data don't use these validators
// while sending images  using json-data can use these validators
router.post(
  "/link",
  linkCreateValidator,
  runValidation,
  requireSignIn,
  authMiddleware,
  createLink
);

router.post("/links", requireSignIn, adminMiddleware, listLinks);

router.put("/click-count", clickCount);

router.get("/link/popular", popular);

router.get("/link/popular/:slug", popularinCategory);

router.get("/link/:id", readLink);

router.put(
  "/link/:id",
  linkUpdateValidator,
  runValidation,
  requireSignIn,
  authMiddleware,
  canUpdateDeleteLink,
  updateLink
);

router.put(
  "/link/admin/:id",
  linkUpdateValidator,
  runValidation,
  requireSignIn,
  adminMiddleware,
  updateLink
);

router.delete(
  "/link/:id",
  requireSignIn,
  authMiddleware,
  canUpdateDeleteLink,
  removeLink
);

router.delete("/link/admin/:id", requireSignIn, adminMiddleware, removeLink);

module.exports = router;
