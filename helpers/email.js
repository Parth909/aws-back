exports.registerEmailParams = (email, token) => {
  // returning a *params* object || Creating sendEmail *params*
  // code was becoming lengthy so moved it here

  return {
    Source: process.env.EMAIL_FROM, // email sent from this adminUser
    Destination: {
      ToAddresses: [email], // to this normalUser
    },
    ReplyToAddresses: [process.env.EMAIL_TO], // reply from normalUser to this User/AdminUser
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
          <html>
          <h1>Verify Your Email Address</h1>
          <p>Please use the following link to complete your registration: </p>
          <p>${process.env.CLIENT_URL}/auth/activate/${token}</p>
          </html>`,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Complete Your Registeration",
      },
    },
  };
};

exports.forgotPasswordEmailParams = (email, token) => {
  return {
    Source: process.env.EMAIL_FROM, // email sent from this adminUser
    Destination: {
      ToAddresses: [email], // to this normalUser
    },
    ReplyToAddresses: [process.env.EMAIL_TO], // reply from normalUser to this User/AdminUser
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
          <html>
          <h1>Reset Password</h1>
          <p>Please use the following link to reset your password: </p>
          <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
          </html>`,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Password Reset Link",
      },
    },
  };
};

exports.linkPublishedParams = (email, data) => {
  return {
    Source: process.env.EMAIL_FROM, // email sent from this adminUser
    Destination: {
      ToAddresses: [email], // to this normalUser
    },
    ReplyToAddresses: [process.env.EMAIL_TO], // reply from normalUser to this User/AdminUser
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
          <html>
          <h1>New Link published ! unifiq.in</h1>
          <p>A new link titled <b>${
            data.title
          }</b> has been just published in the following categories</p>
          
          ${data.categories
            .map((c) => {
              return `
              <div>
                <h2>${c.name}</h2>
                <img src="${c.image.url}" alt="${c.name}" style="height:50px;width:auto;object-fit: cover;"/>
                <h3><a href="${process.env.CLIENT_URL}/link/${c.slug}">Check it out</a></h3>
              </div>
            `;
            })
            .join("-------------------")}

          <br/>
          <p>Do not wish to receive notifications ?</p>
          <p>Turn off notifications by going to your <b>Dashboard</b> > <b>Update Profile</b> > <b>Uncheck the categories</b> </p>
          <p>${process.env.CLIENT_URL}/user/profile/update</p>
          </html>`,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "New Link Published !",
      },
    },
  };
};
