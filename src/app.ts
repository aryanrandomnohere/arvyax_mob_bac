import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import passport from "passport";
import session from "express-session";
import dotenv from "dotenv";
import connectDB from "./config/connectDB.js";
import { SESSION_SECRET } from "./config/constants.js";
import authRoutes from "./routes/authRoutes.js";
import ambienceCategoryRoutes from "./routes/AmbienceCategoryRoutes.js";
import feelingRoutes from "./routes/FeelingRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import { scheduleCleanup } from "./utils/otpService.js";

// Needed for __dirname in ES modules when using TypeScript
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();

// --------------------------------------
//          DATABASE + SCHEDULERS
// --------------------------------------
connectDB();
scheduleCleanup();

// --------------------------------------
//               MIDDLEWARE
// --------------------------------------
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cors({ origin: "*" }));

app.use(express.static(path.join(__dirname, "public")));

// --------------------------------------
//          SESSION + PASSPORT
// --------------------------------------
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    // const RegisterUser = (await import("./models/User")).default;
    // const user = await RegisterUser.findById(id);
    // done(null, user);
  } catch (err) {
    done(err as any, null);
  }
});

// --------------------------------------
//                ROUTES
// --------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/ambience-categories", ambienceCategoryRoutes);
app.use("/api/feelings", feelingRoutes);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Lambda function is healthy",
    timestamp: new Date().toISOString(),
  });
});

// API status
app.get("/api/status", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "API is running on AWS Lambda",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Arvya API is running on AWS Lambda",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      ambienceCategories: "/api/ambience-categories",
      feelings: "/api/feelings",
    },
  });
});

// --------------------------------------
//          ERROR HANDLING
// --------------------------------------
app.use(
  (err: Error, req: Request, res: Response, next: NextFunction): Response => {
    console.error("Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
    });
  }
);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// --------------------------------------
//     LOCAL SERVER (not in Lambda)
// --------------------------------------
if (
  process.env.NODE_ENV !== "production" ||
  !process.env.AWS_LAMBDA_FUNCTION_NAME
) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
} else {
  console.log("🔥 Running in AWS Lambda environment");
}

export default app;
