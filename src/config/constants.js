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

// AWS S3 + SES Credentials
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_REGION = process.env.AWS_REGION;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;

export const AWS_ACCESS_KEY_ID_SES = process.env.AWS_ACCESS_KEY_ID_SES;
export const AWS_SECRET_ACCESS_KEY_SES = process.env.AWS_SECRET_ACCESS_KEY_SES;
export const AWS_SES_REGION = process.env.AWS_SES_REGION;

export const FROM_EMAIL = process.env.FROM_EMAIL;

// Social OAuth configuration (optional but recommended)
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID; // Service ID (for Sign in with Apple)
export const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
export const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
