const postmark = require("postmark");

// const client = new postmark.Client("03de500a-c353-49a1-975e-d161a33f3ba7");
const client = new postmark.Client(process.env.POSTMARK_API_KEY);
const fs = require("fs");

const sendEmail = (options) => {
  client.sendEmail(
    {
      From: process.env.FROM_EMAIL,
      To: options.To,
      Subject: options.Subject,
      TextBody: options.TextBody,
    },
    function (error, result) {
      if (error) {
        console.error("Unable to send email " + error.message);
        return;
      }
      console.info("Sent to postmark for delivery");
    }
  );
};

module.exports = {
  sendEmail,
};
