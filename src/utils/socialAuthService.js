import { createRemoteJWKSet, jwtVerify } from "jose";
import {
  GOOGLE_CLIENT_ID,
  APPLE_CLIENT_ID,
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
} from "../config/constants.js";

// Helper: simple GET with fetch and JSON
async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} for ${url}: ${text}`);
  }
  return res.json();
}

// Verify Google ID Token using tokeninfo endpoint
async function verifyGoogle({ idToken }) {
  if (!idToken) throw new Error("idToken is required for google");
  const data = await getJson(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
      idToken
    )}`
  );
  // Optionally assert aud if configured
  if (GOOGLE_CLIENT_ID && data.aud !== GOOGLE_CLIENT_ID) {
    throw new Error("Google token audience mismatch");
  }
  return {
    provider: "google",
    providerId: data.sub,
    email: data.email,
    emailVerified:
      String(data.email_verified) === "true" || data.email_verified === true,
    name: data.name || "",
    photoUrl: data.picture || "",
  };
}

// Verify Apple identity token (JWT) via Apple's JWKS
async function verifyApple({ idToken }) {
  if (!idToken) throw new Error("idToken is required for apple");
  const JWKS = createRemoteJWKSet(
    new URL("https://appleid.apple.com/auth/keys")
  );
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: "https://appleid.apple.com",
    audience: APPLE_CLIENT_ID, // optional but recommended
  });
  return {
    provider: "apple",
    providerId: payload.sub,
    email: payload.email || "",
    emailVerified:
      payload.email_verified === "true" || payload.email_verified === true,
    name: "",
    photoUrl: "",
  };
}

// Verify Facebook access token using Graph API
async function verifyFacebook({ accessToken }) {
  if (!accessToken) throw new Error("accessToken is required for facebook");
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    throw new Error("Facebook app credentials are not configured");
  }
  // Get app access token
  const appTokenResp = await getJson(
    `https://graph.facebook.com/oauth/access_token?client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&grant_type=client_credentials`
  );
  const appToken = appTokenResp.access_token;
  // Debug user token
  const debug = await getJson(
    `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appToken}`
  );
  const userId = debug?.data?.user_id;
  if (!userId || !debug?.data?.is_valid)
    throw new Error("Invalid Facebook token");
  // Fetch user profile
  const profile = await getJson(
    `https://graph.facebook.com/v12.0/${userId}?fields=id,name,email,picture&access_token=${accessToken}`
  );
  return {
    provider: "facebook",
    providerId: profile.id,
    email: profile.email || "",
    emailVerified: !!profile.email, // FB may not return email
    name: profile.name || "",
    photoUrl: profile.picture?.data?.url || "",
  };
}

// Verify GitHub access token by calling user APIs
async function verifyGithub({ accessToken }) {
  if (!accessToken) throw new Error("accessToken is required for github");
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "arvyax-backend",
  };
  const user = await getJson("https://api.github.com/user", headers);
  // Try to get primary email
  let email = "";
  try {
    const emails = await getJson("https://api.github.com/user/emails", headers);
    const primary =
      (Array.isArray(emails) && emails.find((e) => e.primary)) || emails[0];
    email = primary?.email || "";
  } catch {}
  return {
    provider: "github",
    providerId: String(user.id),
    email,
    emailVerified: true,
    name: user.name || user.login || "",
    photoUrl: user.avatar_url || "",
  };
}

export async function verifySocialLogin(provider, tokens) {
  switch (provider) {
    case "google":
      return verifyGoogle(tokens);
    case "apple":
      return verifyApple(tokens);
    case "facebook":
      return verifyFacebook(tokens);
    case "github":
      return verifyGithub(tokens);
    default:
      throw new Error("Unsupported provider");
  }
}
