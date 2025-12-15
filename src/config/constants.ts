import dotenv from "dotenv";
dotenv.config();

export const MONGODB_URI: string = process.env.MONGODB_URI || "";

export const JWT_SECRET: string = process.env.JWT_SECRET || "arvyax999";

export const SESSION_SECRET: string =
  process.env.SESSION_SECRET || "your_session_secret_key";

export const GMAIL_USER: string | undefined = process.env.GMAIL_USER;
export const GMAIL_PASS: string | undefined = process.env.GMAIL_PASS;

// AWS S3 + SES Credentials
export const AWS_ACCESS_KEY_ID: string | undefined =
  process.env.AWS_ACCESS_KEY_ID;

export const AWS_SECRET_ACCESS_KEY: string | undefined =
  process.env.AWS_SECRET_ACCESS_KEY;

export const AWS_REGION: string | undefined = process.env.AWS_REGION;

export const AWS_BUCKET_NAME: string | undefined = process.env.AWS_BUCKET_NAME;

export const AWS_ACCESS_KEY_ID_SES: string | undefined =
  process.env.AWS_ACCESS_KEY_ID_SES;

export const AWS_SECRET_ACCESS_KEY_SES: string | undefined =
  process.env.AWS_SECRET_ACCESS_KEY_SES;

export const AWS_SES_REGION: string | undefined = process.env.AWS_SES_REGION;

export const FROM_EMAIL: string | undefined = process.env.FROM_EMAIL;
