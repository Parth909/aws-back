const Category = require("../models/category");
const Link = require("../models/link");
const slugify = require("slugify"); // best package with no dependencies
const formidable = require("formidable");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const fs = require("fs");
const { identity } = require("lodash");

// s3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// exports.createCategory = (req, res) => {
//   // saving image using form data
//   let form = new formidable.IncomingForm(); // this will give us form data
//   form.parse(req, (err, fields, files) => {
//     if (err) {
//       return res.status(400).json({
//         error: "Image cannot be uploaded ",
//       });
//     }
//     console.table({ err, fields, files });
//     const { name, content } = fields;
//     const { image } = files; // make sure you send it from the frontend named *image* as well
//     console.log("----Image Properties----", image);

//     const slug = slugify(name);
//     let category = new Category({ name, content, slug });

//     // image validation
//     if (image.size > 4000000) {
//       return res.status(400).json({
//         error: "Image should be less than 4mb",
//       });
//     }

//     // upload image to s3
//     // storing inside category folder
//     const params = {
//       Bucket: "mernawsnew",
//       Key: `category/${uuidv4()}`,
//       Body: fs.readFileSync(image.path), // making sure the entire file(image) is read
//       ACL: "public-read",
//       ContentType: `image/jpg`,
//     };

//     s3.upload(params, (err, data) => {
//       if (err) {
//         console.log("Upload to s3 error ", err);
//         return res.status(400).json({
//           error: "Upload to S3 failed",
//         });
//       }
//       // data contains image url & key
//       console.log("---AWS S3 response data ----", data);

//       category.image.url = data.Location;
//       category.image.key = data.Key;

//       category.save((err, success) => {
//         if (err) return res.status(400).json({ error: "Duplicate category " });

//         return res.json(success); // returning the saved category
//       });
//     });
//   });
// };

exports.createCategory = (req, res) => {
  // sending base64 images to S3
  const { name, image, content } = req.body;

  // image data - (Buffer data, base 64 data, binary data) - same thing
  const base64Data = new Buffer.from(
    image.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  ); // remove the remaining part
  const type = image.split(";")[0].split("/")[1]; // image type

  const slug = slugify(name);
  let category = new Category({ name, content, slug });

  const params = {
    Bucket: "mernawsnew",
    Key: `category/${uuidv4()}.${type}`,
    Body: base64Data, // making sure the entire file(image) is read
    ACL: "public-read",
    ContentEncoding: "base64",
    ContentType: `image/${type}`,
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.log("Upload to s3 error ", err);
      return res.status(400).json({
        error: "Upload to S3 failed",
      });
    }
    // data contains image url & key
    console.log("---AWS S3 response data ----", data);

    category.image.url = data.Location;
    category.image.key = data.Key;
    category.postedBy = req.user._id;

    category.save((err, success) => {
      if (err) return res.status(400).json({ error: "Duplicate category " });

      return res.json(success); // returning the saved category
    });
  });
};

exports.listCategories = (req, res) => {
  Category.find({}).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: "Cannot load categories",
      });
    }
    res.json(data);
  });
};

exports.readCategory = (req, res) => {
  const { slug } = req.params;
  console.log("--- Request body Limit", req.body.limit);
  let limit = req.body.limit ? parseInt(req.body.limit) : 10;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;

  Category.findOne({ slug: slug })
    .populate("postedBy", "_id name username")
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error: "Could not load category",
        });
      }

      let noOfLinks;
      Link.find({ categories: data._id }).exec((err, theLinks) => {
        if (err) return res.status(400).json({ error: "Could not load links" });
        noOfLinks = theLinks;
        console.log("No of links length", noOfLinks.length);

        Link.find({ categories: data._id })
          .populate("postedBy", "_id name username")
          .populate("categories", "name")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec((err, links) => {
            if (err) {
              return res.status(400).json({
                error: "Could not find links for the category",
              });
            }
            return res.json({
              category: data,
              links,
              noOfLinks: noOfLinks.length,
            });
          });
      });
      // skip the already loaded docs & load the other ones with some limit
    });
};

exports.updateCategory = (req, res) => {
  const { slug } = req.params;
  const { name, image, content } = req.body;

  Category.findOneAndUpdate({ slug }, { name, content }, { new: true }).exec(
    (err, updated) => {
      if (err) {
        return res.status(400).json({
          error: "Could not find the category to update",
        });
      }
      if (image) {
        // remove the existing image from S3 before uploading new/updated one
        const deleteParams = {
          Bucket: "mernawsnew",
          Key: `${updated.image.key}`,
        };

        s3.deleteObject(deleteParams, (err, success) => {
          if (err) {
            console.log("---- S3 DELETE ERROR", err);
            return res.status(400).json({
              error: "Cannot update the new image",
            });
          }
        });

        // image data - (Buffer data, base 64 data, binary data) - same thing
        const base64Data = new Buffer.from(
          image.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        ); // remove the remaining part
        const type = image.split(";")[0].split("/")[1]; // image type

        const uploadParams = {
          Bucket: "mernawsnew",
          Key: `category/${uuidv4()}.${type}`,
          Body: base64Data, // making sure the entire file(image) is read
          ACL: "public-read",
          ContentEncoding: "base64",
          ContentType: `image/${type}`,
        };

        s3.upload(uploadParams, (err, data) => {
          if (err) {
            console.log("Upload to s3 error ", err);
            return res.status(400).json({
              error: "Upload to S3 failed",
            });
          }
          // data contains image url & key
          console.log("---AWS S3 response data ----", data);

          updated.image.url = data.Location;
          updated.image.key = data.Key;

          updated.save((err, success) => {
            if (err)
              return res.status(400).json({ error: "Duplicate category " });

            return res.json(success); // returning the saved category
          });
        });
      } else {
        res.json(updated);
      }
    }
  );
};

exports.removeCategory = (req, res) => {
  const { slug } = req.params;

  Category.findOneAndRemove({ slug }).exec((err, data) => {
    if (err) {
      return res.status(400).json({ error: "Could not delete the category" });
    }

    if (data.image) {
      const deleteParams = {
        Bucket: "mernawsnew",
        Key: `${data.image.key}`, // contains the correct path like *category/dsjfsjdlfsjfldsl.jpeg*
      };

      s3.deleteObject(deleteParams, (err, success) => {
        if (err) {
          console.log("---- S3 DELETE ERROR", err);
          return res.status(400).json({
            error: "Cannot update the new image",
          });
        }
      });
    }

    res.json({
      message: "Category deleted successfully",
    });
  });
};
