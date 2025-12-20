import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../config/constants.js";
import type { Request, Response, NextFunction } from "express";
import UserActivityDay from "../models/UserActivityDay.js";

// Extend Express Request to include "user"
declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader =
      req.header("authorization") || req.header("Authorization");
    let token =
      (authHeader && /^Bearer\s+/i.test(authHeader)
        ? authHeader.replace(/^Bearer\s+/i, "")
        : null) ||
      req.header("x-auth-token") ||
      null;

    token = token?.trim() || null;
    if (
      token &&
      ((token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'")))
    ) {
      token = token.slice(1, -1).trim();
    }

    // Remove whitespace/newlines and any accidental non-JWT characters (common copy/paste issues)
    if (token) {
      token = token.replace(/\s+/g, "");
      token = token.replace(/[^A-Za-z0-9._-]/g, "");
    }

    // Basic JWT shape validation to avoid confusing low-level JSON parse errors
    const isJwtLike =
      typeof token === "string" &&
      /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);

    console.log("Auth Middleware - Token present:", Boolean(token));
    if (!token) {
      return res.status(400).json({ error: "Access denied" });
    }
    if (!isJwtLike) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Pre-decode to catch truncated/malformed JWTs cleanly (avoids JSON.parse errors deep in jsonwebtoken)
    try {
      const [headerSeg, payloadSeg] = token.split(".");
      JSON.parse(Buffer.from(headerSeg, "base64url").toString("utf8"));
      JSON.parse(Buffer.from(payloadSeg, "base64url").toString("utf8"));
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Attach user
    req.user = decoded?.user;

    const userId = req.user?.id;
    if (userId) {
      try {
        await UserActivityDay.markActive(userId);
      } catch (err) {
        console.warn("ACTIVITY MARK ERROR:", err);
      }
    }
    next();
  } catch (err) {
    console.error("JWT Error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};
