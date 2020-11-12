const { check } = require("express-validator");

exports.linkCreateValidator = [
  check("title").not().isEmpty().withMessage("Title is required"),
  check("url").not().isEmpty().withMessage("Url is required"),
  check("categories").not().isEmpty().withMessage("Pick at least one category"),
  check("type").not().isEmpty().withMessage("Pick a type"),
  check("medium").not().isEmpty().withMessage("Pick a medium"),
];

exports.linkUpdateValidator = [
  check("title").not().isEmpty().withMessage("Title is required"),
  check("url").not().isEmpty().withMessage("Url is required"),
  check("categories").not().isEmpty().withMessage("Pick at least one category"),
  check("type").not().isEmpty().withMessage("Pick a type"),
  check("medium").not().isEmpty().withMessage("Pick a medium"),
];
