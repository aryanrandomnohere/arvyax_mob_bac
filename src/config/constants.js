import dotenv from "dotenv";
import path from "path";

// Load environment variables.
// By default dotenv looks for `${process.cwd()}/.env`.
// This project sometimes keeps the env file at `src/.env`, so we fall back to that.
dotenv.config();
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(process.cwd(), "src", ".env") });
}

function cleanEnv(value) {
  if (typeof value !== "string") return "";
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

export const MONGODB_URI = cleanEnv(process.env.MONGODB_URI) || "";
export const JWT_SECRET = process.env.JWT_SECRET || "arvyax999";
export const SESSION_SECRET =
  process.env.SESSION_SECRET || "your_session_secret_key";

export const GMAIL_USER = process.env.GMAIL_USER;
export const GMAIL_PASS = process.env.GMAIL_PASS;

// Twilio configuration
export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
export const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Cloudinary configuration
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Cloudflare R2 configuration
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
export const R2_ENDPOINT = process.env.R2_ENDPOINT;
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

// AWS S3 configuration
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_REGION = process.env.AWS_REGION;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// AWS SES Email configuration
export const AWS_SES_REGION = process.env.AWS_SES_REGION;
export const FROM_EMAIL = process.env.FROM_EMAIL;
export const AWS_ACCESS_KEY_ID_SES = process.env.AWS_ACCESS_KEY_ID_SES;
export const AWS_SECRET_ACCESS_KEY_SES = process.env.AWS_SECRET_ACCESS_KEY_SES;

// Social OAuth configuration (optional but recommended)
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID; // Service ID (for Sign in with Apple)
export const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
export const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Test credentials for Play Store testing (optional)
export const TEST_EMAIL = process.env.TEST_EMAIL;
export const TEST_OTP = process.env.TEST_OTP;
