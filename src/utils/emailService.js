import nodemailer from "nodemailer";
import AWS from "aws-sdk";
import {
  AWS_ACCESS_KEY_ID_SES,
  AWS_SECRET_ACCESS_KEY_SES,
  AWS_SES_REGION,
  FROM_EMAIL,
} from "../config/constants.js";
import * as emailTemplates from "./emailTemplates.js";

const isSesConfigured =
  Boolean(AWS_SES_REGION) &&
  (Boolean(AWS_ACCESS_KEY_ID_SES && AWS_SECRET_ACCESS_KEY_SES) ||
    Boolean(
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ));

const transporter = (() => {
  if (!isSesConfigured) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  // Nodemailer SES transport expects an AWS SDK v2 SES client with `sendRawEmail()`.
  // Passing an AWS SDK v3 client (SESv2Client) causes: TypeError: ses.sendRawEmail is not a function
  try {
    const sesOptions = {
      region: AWS_SES_REGION,
      apiVersion: "2010-12-01",
    };

    if (AWS_ACCESS_KEY_ID_SES && AWS_SECRET_ACCESS_KEY_SES) {
      sesOptions.accessKeyId = AWS_ACCESS_KEY_ID_SES;
      sesOptions.secretAccessKey = AWS_SECRET_ACCESS_KEY_SES;
    }

    const ses = new AWS.SES(sesOptions);

    // Extra safety: if something is misconfigured, fall back instead of crashing the app.
    if (typeof ses.sendRawEmail !== "function") {
      console.warn(
        "SES client missing sendRawEmail(); falling back to jsonTransport"
      );
      return nodemailer.createTransport({ jsonTransport: true });
    }

    return nodemailer.createTransport({
      SES: { ses, aws: AWS },
    });
  } catch (err) {
    console.warn(
      "Failed to initialize SES transport; falling back to jsonTransport:",
      err?.message || err
    );
    return nodemailer.createTransport({ jsonTransport: true });
  }
})();

export const sendWelcomeEmail = async (email, username) => {
  try {
    const mailOptions = {
      from: `\"ARVYA_X\" <${FROM_EMAIL}>`,
      to: email,
      subject: "Welcome to Revoltron_X - Your ARVYA_X Journey Begins!",
      html: emailTemplates.welcomeEmailTemplate(username),
    };

    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
};

export const sendOtpEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `\"ARVYA_X\" <${FROM_EMAIL}>`,
      to: email,
      subject: "Login OTP - ARVYA_X",
      html: emailTemplates.otpEmailTemplate(otp),
    };

    await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
};

export default {
  sendWelcomeEmail,
  sendOtpEmail,
};
