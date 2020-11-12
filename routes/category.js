const express = require("express");
const router = express.Router();

// validators
const {
  categoryCreateValidator,
  categoryUpdateValidator,
} = require("../validators/category");

const { runValidation } = require("../validators");

const {
  requireSignIn,
  adminMiddleware,
  authMiddleware,
} = require("../controllers/auth");

// controllers
const {
  createCategory,
  listCategories,
  readCategory,
  updateCategory,
  removeCategory,
} = require("../controllers/category");

// routes
// while using images with the help of form-data don't use these validators
// while sending images  using json-data can use these validators
router.post(
  "/category",
  categoryCreateValidator,
  runValidation,
  requireSignIn,
  adminMiddleware,
  createCategory
);

router.get("/categories", listCategories);

router.post("/category/:slug", readCategory);

router.put(
  "/category/:slug",
  categoryUpdateValidator,
  runValidation,
  requireSignIn,
  adminMiddleware,
  updateCategory
);

router.delete(
  "/category/:slug",
  requireSignIn,
  adminMiddleware,
  removeCategory
);

module.exports = router;
