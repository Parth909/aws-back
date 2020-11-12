const Link = require("../models/link");
const User = require("../models/user");

exports.readProfile = (req, res) => {
  // delete req.profile.hashed_password;
  // delete req.profile["hashed_password"]; -> these 2 don't work for some reason

  req.profile.hashed_password = undefined; // undefined value's property *Only* is not returned by res.json
  // null & false will be returned
  req.profile.salt = undefined;
  Link.find({ postedBy: req.user._id })
    .populate("categories", "name slug")
    .populate("postedBy", "name")
    .sort({ createdAt: -1 })
    .exec((err, links) => {
      if (err) {
        return res.json({
          error: "Could not find Links",
        });
      }
      res.json({ user: req.profile, links });
    });
};

exports.updateProfile = (req, res) => {
  const { name, password, categories } = req.body;

  switch (true) {
    case password && password.length < 6:
      return res
        .status(400)
        .json({ error: "Password must be atleast 6 characters long" });
      break;
  }

  User.findOneAndUpdate(
    { _id: req.user._id },
    { name, password, categories },
    { new: true }
  ).exec((err, updated) => {
    if (err) {
      return res.status(400).json({ error: "Could not find user to update" });
    }
    updated.hashed_password = undefined;
    updated.salt = undefined;

    res.json({ user: updated, message: "Sucessfully updated user profile" });
  });
};
