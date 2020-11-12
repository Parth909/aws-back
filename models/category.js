const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      max: 32,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
      index: true, // index gives performance benefits
      // the category will be queried using this slug
    },
    image: {
      url: String,
      key: String, // used while deletion of the image
    },
    content: {
      type: {}, // we can include anything in an object ( we will be storing html)
      min: 20,
      max: 200000, // 2MB
    },
    postedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
