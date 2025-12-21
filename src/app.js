import express from "express";
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

// Needed for __dirname in ES modules
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

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // If you later need this, load your user model and fetch here.
    done(null, null);
  } catch (err) {
    done(err, null);
  }
});

// --------------------------------------
//                ROUTES
// --------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/ambience-categories", ambienceCategoryRoutes);
app.use("/api/feelings", feelingRoutes);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Lambda function is healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Arvya API is running",
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
app.use((err, req, res, next) => {
  console.error("Error:", err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err?.message
        : "Something went wrong",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

export default app;
