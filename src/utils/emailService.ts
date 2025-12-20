// emailService.ts

import nodemailer from "nodemailer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { fromEnv } from "@aws-sdk/credential-providers";
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
    // Keep the app running even without SES env vars.
    return nodemailer.createTransport({ jsonTransport: true });
  }

  const credentials =
    AWS_ACCESS_KEY_ID_SES && AWS_SECRET_ACCESS_KEY_SES
      ? {
          accessKeyId: AWS_ACCESS_KEY_ID_SES,
          secretAccessKey: AWS_SECRET_ACCESS_KEY_SES,
        }
      : fromEnv();

  const sesClient = new SESv2Client({
    region: AWS_SES_REGION,
    credentials,
  });

  // Nodemailer SES transport expects these exact keys.
  return nodemailer.createTransport({
    SES: {
      sesClient,
      SendEmailCommand,
    },
  } as any);
})();

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
