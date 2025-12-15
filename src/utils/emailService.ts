// emailService.ts
import nodemailer from "nodemailer";
import AWS from "aws-sdk";
import {
  AWS_ACCESS_KEY_ID_SES,
  AWS_SECRET_ACCESS_KEY_SES,
  AWS_SES_REGION,
  FROM_EMAIL,
} from "../config/constants.js";
import * as emailTemplates from "./emailTemplates.js";

// Configure AWS SES
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID_SES!,
  secretAccessKey: AWS_SECRET_ACCESS_KEY_SES!,
  region: AWS_SES_REGION!,
});

// Create Nodemailer + SES transporter
const transporter = nodemailer.createTransport({
  SES: new AWS.SES({
    apiVersion: "2010-12-01",
  }),
} as any);

export const sendWelcomeEmail = async (
  email: string,
  username: string
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: `"ARVYA_X" <${FROM_EMAIL}>`,
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

export const sendOtpEmail = async (
  email: string,
  otp: string
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: `"ARVYA_X" <${FROM_EMAIL}>`,
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
