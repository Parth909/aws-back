const Link = require("../models/link");
const slugify = require("slugify");
const Category = require("../models/category");
const User = require("../models/user");
const { linkPublishedParams } = require("../helpers/email");
const AWS = require("aws-sdk");
/*
  createLink,
  listLinks,
  readLink,
  updateLink,
  removeLink,
*/

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

exports.createLink = (req, res) => {
  const { title, url, categories, type, medium } = req.body;
  // console.table({ title, url, categories, type, medium });

  const slug = url;

  // posted by User
  let link = new Link({ title, url, categories, type, medium, slug });
  link.postedBy = req.user._id;

  link.save((err, data) => {
    if (err) {
      console.log(err);
      return res.status(400).json({
        error: "Link already exists",
      });
    }

    res.json(data);

    // find all users who have this category as favorite

    // { field: { $in: [<value1>, <value2>, ... <valueN> ] } }
    //The $in operator selects the documents where the value of a *field* equals any value in the specified array
    User.find({ categories: { $in: categories } }).exec((err, users) => {
      if (err) {
        console.log("Error finding users to send email on link publish");
        throw new Error(err);
      }
      Category.find({ _id: { $in: categories } }).exec((err, result) => {
        if (err) {
          console.log("Error finding users to send email on link publish");
          throw new Error(err);
        }
        // data.categories contain only the array of category ids
        // we are replacing *array of cat ids* with *array of each cat's whole data*
        data.categories = result;

        for (let i = 0; i < users.length; i++) {
          const params = linkPublishedParams(users[i].email, data);
          const sendEmail = ses.sendEmail(params).promise();

          sendEmail
            .then((success) => {
              console.log("Email submitted to ses");
              return; // exit that iteration
            })
            .catch((failure) => {
              console.log("Error on email submitted to SES", failure);
              return; // exit that iteration
            });
        }
      });
    });
  });
};

exports.listLinks = (req, res) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 7;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;
  let noOfLinks;
  Link.find({}).exec((err, theLinks) => {
    noOfLinks = theLinks;
    Link.find({})
      .populate("postedBy", "_id name username")
      .populate("categories", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec((err, data) => {
        if (err) {
          return res.status(400).json({
            error: "Links cannot be found",
          });
        }
        res.json({ links: data, noOfLinks: noOfLinks.length });
      });
  });
};

exports.readLink = (req, res) => {
  const { id } = req.params;

  Link.findOne({ _id: id }).exec((err, data) => {
    if (err) {
      return res.status(400).json({ error: "Could not find the link" });
    }
    res.json(data);
  });
};

exports.updateLink = (req, res) => {
  const { id } = req.params;
  const { title, url, categories, type, medium } = req.body;

  const data = {
    title,
    url,
    categories,
    type,
    medium,
  };
  console.log(data);
  console.log(id);

  Link.findOneAndUpdate({ _id: id }, data, { new: true }).exec(
    (err, updated) => {
      if (err) {
        console.log("Error while updating link ------ ", err);
        return res.status(400).json({ error: "Could not update the link" });
      }
      console.log("Updated the link successfully ---- ", updated);
      res.json(updated);
    }
  );
};

exports.removeLink = (req, res) => {
  const { id } = req.params;
  Link.findOneAndRemove({ _id: id }).exec((err, data) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: "Could not remove the link" });
    }
    res.json({
      message: "Found & removed successfully",
    });
  });
};

exports.clickCount = (req, res) => {
  const { linkId } = req.body;

  // the data returned should be populated data
  Link.findByIdAndUpdate(linkId, { $inc: { clicks: 1 } }, { new: true })
    .populate("postedBy", "_id name username")
    .populate("categories", "name")
    .exec((err, result) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: "Could not update view count" });
      }
      console.log(result);
      res.json(result);
    });
};

exports.popular = (req, res) => {
  Link.find()
    .populate("postedBy", "name")
    .sort({ clicks: -1 })
    .limit(6)
    .exec((err, links) => {
      if (err) {
        return res.status(400).json({ error: "Links not found" });
      }
      res.json(links);
    });
};

exports.popularinCategory = (req, res) => {
  const { slug } = req.params;

  Category.findOne({ slug }).exec((err, category) => {
    if (err) {
      return res.status(400).json({ error: "Could not load categories" });
    }
    Link.find({ categories: category })
      .sort({ clicks: -1 })
      .limit(3)
      .exec((err, links) => {
        if (err) {
          return res.status(400).json({ error: "Links not found" });
        }
        res.json(links);
      });
  });
};
