const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      max: 100,
    },
    url: {
      type: String,
      trim: true,
      required: true,
      max: 100,
    },
    slug: {
      type: String,
      lowercase: true,
      index: true, // index gives performance benefits
      // the category will be queried using this slug
    },
    postedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    categories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Category",
        required: true,
      },
    ],
    type: {
      type: String,
      default: "Free",
    },
    medium: {
      type: String,
      default: "Video",
    },
    clicks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Link", linkSchema);
