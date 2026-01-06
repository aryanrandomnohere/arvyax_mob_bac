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
async function verifyGoogle({ idToken, accessToken }) {
  const normalizedAccessToken =
    typeof accessToken === "string" ? accessToken.trim() : "";
  const normalizedIdToken = typeof idToken === "string" ? idToken.trim() : "";

  // Treat empty strings as not provided
  accessToken = normalizedAccessToken.length
    ? normalizedAccessToken
    : undefined;
  idToken = normalizedIdToken.length ? normalizedIdToken : undefined;

  if (!idToken && !accessToken) {
    const err = new Error("Provide google idToken or accessToken");
    err.statusCode = 400;
    throw err;
  }

  // If caller provided only accessToken, verify via userinfo
  if (!idToken && accessToken) {
    return verifyGoogleAccessToken({ accessToken });
  }

  // Sanitize (Postman / logs sometimes introduce whitespace/newlines/quotes)
  let tokenStr = String(idToken).trim();
  if (
    (tokenStr.startsWith('"') && tokenStr.endsWith('"')) ||
    (tokenStr.startsWith("'") && tokenStr.endsWith("'"))
  ) {
    tokenStr = tokenStr.slice(1, -1).trim();
  }
  // Remove any accidental whitespace inside the token
  tokenStr = tokenStr.replace(/\s+/g, "");

  const parts = tokenStr.split(".");
  console.log("verifyGoogle idToken meta:", {
    length: tokenStr.length,
    parts: parts.length,
    partLengths: parts.map((p) => p.length),
    head: tokenStr.slice(0, 16),
    tail: tokenStr.slice(-16),
  });

  if (parts.length !== 3) {
    throw new Error(
      "Invalid Google idToken format (expected 3 JWT parts). Token may be truncated."
    );
  }

  // Decode header to help diagnose signature failures (no secrets here)
  try {
    const headerJson = JSON.parse(
      Buffer.from(parts[0].replace(/-/g, "+").replace(/_/g, "/"), "base64")
        .toString("utf8")
        .trim()
    );
    console.log("verifyGoogle jwt header:", {
      alg: headerJson?.alg,
      kid: headerJson?.kid,
      typ: headerJson?.typ,
    });
  } catch {
    // ignore header parse failures
  }

  // Decode signature length (RS256 signature should decode to 256 bytes)
  let sigBytes = null;
  try {
    const sigB64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
    const sig = Buffer.from(
      sigB64 + "==".slice(0, (4 - (sigB64.length % 4)) % 4),
      "base64"
    );
    sigBytes = sig.length;
    console.log("verifyGoogle signature bytes:", sigBytes);
  } catch {
    // ignore
  }

  // If signature is clearly truncated/corrupted, don't even attempt verification.
  // For RS256 with Google's current keys, signature bytes should be 256.
  if (sigBytes !== null && sigBytes !== 256) {
    if (accessToken) {
      console.warn(
        "Google idToken signature looks invalid; falling back to accessToken verification"
      );
      return verifyGoogleAccessToken({ accessToken });
    }
    const err = new Error(
      `Google idToken appears truncated/corrupted (signature bytes ${sigBytes}, expected 256). If you are testing via Postman, set googleAccessToken and resend; otherwise send a fresh idToken directly from the app without copy/paste.`
    );
    err.statusCode = 400;
    throw err;
  }

  const GOOGLE_JWKS = createRemoteJWKSet(
    new URL("https://www.googleapis.com/oauth2/v3/certs")
  );

  const options = {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    clockTolerance: 10, // seconds
  };
  if (GOOGLE_CLIENT_ID) options.audience = GOOGLE_CLIENT_ID;

  let payload;
  try {
    ({ payload } = await jwtVerify(tokenStr, GOOGLE_JWKS, options));
  } catch (err) {
    // Extra hint: check if the token's kid exists in Google's JWKS
    try {
      const headerJson = JSON.parse(
        Buffer.from(parts[0].replace(/-/g, "+").replace(/_/g, "/"), "base64")
          .toString("utf8")
          .trim()
      );
      const kid = headerJson?.kid;
      if (kid) {
        const jwksRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/certs"
        );
        const jwks = await jwksRes.json();
        const kids = Array.isArray(jwks?.keys)
          ? jwks.keys.map((k) => k.kid).filter(Boolean)
          : [];
        console.log("verifyGoogle jwks kid match:", {
          tokenKid: kid,
          jwksKidsCount: kids.length,
          kidFound: kids.includes(kid),
        });
      }
    } catch {
      // ignore
    }

    // Fallback to tokeninfo to aid debugging when JWT verification fails.
    try {
      const data = await getJson(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
          tokenStr
        )}`
      );
      // If tokeninfo works, map its response.
      if (GOOGLE_CLIENT_ID && data.aud && data.aud !== GOOGLE_CLIENT_ID) {
        throw new Error("Google token audience mismatch");
      }
      return {
        provider: "google",
        providerId: data.sub,
        email: data.email,
        emailVerified:
          String(data.email_verified) === "true" ||
          data.email_verified === true,
        name: data.name || "",
        photoUrl: data.picture || "",
      };
    } catch (fallbackErr) {
      if (accessToken) {
        console.warn(
          "Google idToken verification failed; falling back to accessToken verification"
        );
        return verifyGoogleAccessToken({ accessToken });
      }
      throw err;
    }
  }

  return {
    provider: "google",
    // IMPORTANT: `sub` is the stable Google user identifier for this account.
    // We store this value in Mongo as `user.googleId` and DO NOT store the idToken itself.
    providerId: payload.sub,
    email: payload.email || "",
    emailVerified:
      payload.email_verified === "true" || payload.email_verified === true,
    name: payload.name || "",
    photoUrl: payload.picture || "",
  };
}

async function verifyGoogleAccessToken({ accessToken }) {
  if (!accessToken) throw new Error("accessToken is required for google");

  // Validate token audience (recommended)
  const info = await getJson(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(
      String(accessToken).trim()
    )}`
  );

  const tokenAud = info?.aud || info?.audience || info?.issued_to || "";
  if (
    GOOGLE_CLIENT_ID &&
    tokenAud &&
    String(tokenAud).trim() !== String(GOOGLE_CLIENT_ID).trim()
  ) {
    const err = new Error("Google access token audience mismatch");
    err.statusCode = 401;
    throw err;
  }

  // Fetch profile
  const profile = await getJson(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { Authorization: `Bearer ${String(accessToken).trim()}` }
  );

  if (!profile?.sub) {
    const err = new Error("Invalid Google access token");
    err.statusCode = 401;
    throw err;
  }

  return {
    provider: "google",
    providerId: profile.sub,
    email: profile.email || "",
    emailVerified:
      profile.email_verified === true || profile.email_verified === "true",
    name: profile.name || "",
    photoUrl: profile.picture || "",
  };
}

// Verify Apple identity token (JWT) via Apple's JWKS
async function verifyApple({ idToken }) {
  if (!idToken) throw new Error("idToken is required for apple");
  const JWKS = createRemoteJWKSet(
    new URL("https://appleid.apple.com/auth/keys")
  );
  const options = {
    issuer: "https://appleid.apple.com",
  };
  // Only enforce audience when configured; otherwise allow verification without it.
  if (APPLE_CLIENT_ID) {
    options.audience = APPLE_CLIENT_ID;
  }

  const { payload } = await jwtVerify(idToken, JWKS, options);
  return {
    provider: "apple",
    // IMPORTANT: `sub` is the stable Apple user identifier for this account.
    // We store this value in Mongo as `user.appleId` and DO NOT store the idToken itself.
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
