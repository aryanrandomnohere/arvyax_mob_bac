import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../config/constants.js";
import type { Request, Response, NextFunction } from "express";

// Extend Express Request to include "user"
declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) {
      return res.status(400).json({ error: "Access denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Attach user
    req.user = decoded?.user;
    next();
  } catch (err) {
    console.error("JWT Error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};
