const Link = require("../models/link");
const User = require("../models/user");
const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken"); // used for signing, verifying & decoding
// express-jwt is used to check the validity of *token from headers* by performing series of validations & the decoded info will be available to us in *req.user* by default
const {
  registerEmailParams,
  forgotPasswordEmailParams,
} = require("../helpers/email");
const { default: ShortUniqueId } = require("short-unique-id");
const uid = new ShortUniqueId();
const expressJWT = require("express-jwt");
const _ = require("lodash");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

exports.register = (req, res) => {
  const { name, email, password, categories } = req.body;

  // check if user exists in the db

  User.findOne({ email: email }).exec((err, user) => {
    if (user) {
      return res.status(400).json({
        error: "Email is already taken",
      });
    }

    // Generate JWT with name, email, password

    const token = jwt.sign(
      { name, email, password, categories },
      process.env.JWT_ACCOUNT_ACTIVATION, // secret key while creating account
      {
        expiresIn: "10m", // acccount should be activated in 10 mins before token expires
      }
    );

    // CREATE A TEMPLATE FOR THE EMAIL
    const params = registerEmailParams(email, token);

    // SEND THE EMAIL
    const sendEmailOnRegister = ses.sendEmail(params).promise();

    sendEmailOnRegister
      .then((data) => {
        console.log("email submitted fo SES", data);
        res.json({
          message: `Email has been sent to ${email}, Click on the link in the email to complete your registration`,
        });
      })
      .catch((error) => {
        console.log("SES email error on register", error);
        res.status(406).json({
          error: `Cannot Verify Your Email plz try again`,
        });
      });

    // SEND EMAIL END
  });
};

exports.registerActivate = (req, res) => {
  const { token } = req.body;

  jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, (err, decodedInfo) => {
    if (err) {
      return res.status(401).json({ error: "Token has expired, Try again !" });
    }
    console.log("decoded info", decodedInfo);

    const { name, email, password, categories } = decodedInfo;

    const username = name + "#" + uid();

    const newUser = new User({ username, name, email, password, categories }); // already checked in above function if mail is taken
    newUser.save((err, user) => {
      if (err) {
        return res
          .status(401)
          .json({ error: "Error saving user in the database. Try later" });
      }

      return res.json({
        message: "Registered successfully. Please Login",
      });
    });
  });
};

exports.login = async (req, res) => {
  // destructuring *email* and naming it *rEmail*
  const { email: rEmail, password: rPassword } = req.body;
  // console.table({ email, password });

  // User.findOne({email: email}).exec((err, user)=>{/* All the stuff */})//Promise way

  const user = await User.findOne({ email: rEmail });
  // user is null if not present & !null -> true
  if (!user) {
    return res.status(400).json({
      error: "User with that email does not exist. Please register",
    });
  }

  // authenticate method of User Schema
  if (!user.authenticate(rPassword)) {
    return res.status(400).json({
      error: "Email and password do not match",
    });
  }

  // generate token and send to client
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    // as the payload is *id only* when the token decoded by *express-jwt* , *id* will be available to us as *req.user.id*
    expiresIn: "7d", // expire after 7 days
  });

  const { _id, name, email, role } = user;

  return res.json({
    token,
    user: { _id, name, email, role },
  });
};

// looks for token in the headers & decodes and adds the decodedInfo(payload passed during signing in) in *req.user*
exports.requireSignIn = expressJWT({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
}); // gives -> req.user._id

// we can Create our middlewares directory and add this there
exports.authMiddleware = (req, res, next) => {
  const authUserId = req.user._id;
  User.findOne({ _id: authUserId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    // We don't want to use totally different routes to perform same action so commenting
    // if (user.role === "admin") {
    //   return res
    //     .status(400)
    //     .json({ error: "No need for Admin to access user routes" });
    // }

    req.profile = user; // adding in the request
    next();
  });
};

exports.adminMiddleware = (req, res, next) => {
  const adminUserId = req.user._id;
  User.findOne({ _id: adminUserId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    if (user.role !== "admin") {
      return res.status(400).json({ error: "Admin resource. Access Denied" });
    }

    req.profile = user; // adding in the request
    next();
  });
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  // check if user exists in the db
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with that email doesn't exist",
      });
    }

    // generate the token
    const token = jwt.sign(
      { name: user.name },
      process.env.JWT_RESET_PASSWORD,
      { expiresIn: "10m" }
    );

    // CREATE A TEMPLATE FOR THE EMAIL
    const params = forgotPasswordEmailParams(email, token);

    // save the resetPasswordLink in the db
    return user.updateOne({ resetPasswordLink: token }, (err, success) => {
      if (err) {
        return res.status(400).json({
          error: "Password Reset failed Try again",
        });
      }

      // SEND THE EMAIL
      const sendResetEmail = ses.sendEmail(params).promise();

      sendResetEmail
        .then((data) => {
          console.log("email submitted fo SES", data);
          res.json({
            message: `Email has been sent to ${email}, Click on the link in the email to reset your password`,
          });
        })
        .catch((error) => {
          console.log("SES email error on reset password", error);
          res.status(406).json({
            error: `Cannot Verify Your Email plz try again`,
          });
        });
    });
  });
};

// exports.resetPassword = async (req, res) => {
//   const { resetPasswordLink, newPassword } = req.body;

//   if (resetPasswordLink) {
//     try {
//       // check for expiry
//       let validLink = jwt.verify(
//         resetPasswordLink,
//         process.env.JWT_RESET_PASSWORD
//       );

//       // update the user's password
//       const updatedUser = await User.findOneAndUpdate(
//         { resetPasswordLink },
//         {
//           password: newPassword,
//           resetPasswordLink: "",
//         }
//       );

//       await updatedUser.save();

//       if (!updatedUser) {
//         return res.status(400).json({
//           error: "Reset link not in the db or token is invalid",
//         });
//       }

//       res.json({
//         message: "Great login with your new password",
//       });
//     } catch (error) {
//       console.log(
//         " -------- Checking Reset Password Error ----- \n",
//         error.message
//       );

//       if (error.message.includes("expired")) {
//         return res.status(400).json({
//           error: "Link has expired !",
//         });
//       }

//       if (
//         error.message.includes("invalid") ||
//         error.message.includes("malformed")
//       ) {
//         return res.status(400).json({
//           error: "Link is not a valid !",
//         });
//       }

//       return res.status(400).json({
//         error: "Link dysfunctioned, try again",
//       });
//     }
//   }
// };

exports.resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;

  if (resetPasswordLink) {
    // check expiry
    jwt.verify(
      resetPasswordLink,
      process.env.JWT_RESET_PASSWORD,
      (err, success) => {
        if (err) {
          return res.status(400).json({
            error: "Expired link try again",
          });
        }

        User.findOne({ resetPasswordLink }).exec((err, user) => {
          if (err || !user) {
            return res.status(400).json({
              error: "Invalid link try again",
            });
          }

          const updatedFields = {
            password: newPassword,
            resetPasswordLink: "",
          };

          // extend or merge with the existing user object

          user = _.extend(user, updatedFields);

          user.save((err, result) => {
            if (err) {
              return res.status(400).json({
                error: "Password reset failed, try again",
              });
            }

            return res.json({
              message: "Great login with your new password",
            });
          });
        });
      }
    );
  }
};

exports.canUpdateDeleteLink = (req, res, next) => {
  console.log(" - - - Running cantUpdateDeleteMiddleware - - - ");
  const { id } = req.params;
  User.findOne({ _id: req.user._id }).exec((err, user) => {
    console.log(user.role);
    Link.findOne({ _id: id }).exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error: "Can't update or delete the link",
        });
      }
      let authorizedUser =
        data.postedBy._id.toString() === req.user._id.toString();
      if (authorizedUser || user.role === "admin") {
        next();
      } else {
        return res.status(400).json({
          error: "Can't update or delete the link",
        });
      }
    });
  });
};
