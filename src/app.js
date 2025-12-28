import express from "express";
import cors from "cors";
import path from "path";
import passport from "passport";
import session from "express-session";
import dotenv from "dotenv";
import connectDB from "./config/connectDB.js";
import { SESSION_SECRET } from "./config/constants.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import ambienceCategoryRoutes from "./routes/AmbienceCategoryRoutes.js";
import feelingRoutes from "./routes/FeelingRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import lifeContentRoutes from "./routes/lifeContentRoutes.js";
import audioRoutes from "./routes/audioRoutes.js";
import ambienceCommandRoutes from "./routes/ambienceCommandRoutes.js";
import ambienceAudioRoutes from "./routes/ambienceAudioRoutes.js";
import { scheduleCleanup } from "./utils/otpService.js";
import yogaPracticeRoutes from "./routes/yogaPracticeRoutes.js";
import yogaSessionRoutes from "./routes/yogaSessionRoutes.js";
import cloudflareImageStorageRoutes from "./routes/cloudflareImageStorageRoutes.js";
import cloudflareVideoStorageRoutes from "./routes/cloudflareVideoStorageRoutes.js";
import hlsVideoStorageRoutes from "./routes/hlsVideoStorageRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";

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
app.use("/api/", profileRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/ambience-categories", ambienceCategoryRoutes);
app.use("/api/feelings", feelingRoutes);
app.use("/api/life", lifeContentRoutes);
app.use("/api", audioRoutes);
app.use("/api", ambienceAudioRoutes);
app.use("/api/ambience-commands", ambienceCommandRoutes);
app.use("/api", yogaPracticeRoutes);
app.use("/api", yogaSessionRoutes);
app.use("/api", cloudflareImageStorageRoutes); // Mounted on /api to match old backend
app.use("/api", cloudflareVideoStorageRoutes); // Video routes for Cloudflare R2
app.use("/api", hlsVideoStorageRoutes); // HLS video routes with FFmpeg processing
app.use("/api", leaderboardRoutes);
app.use("/api", journalRoutes);

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
      life: "/api/life",
      audios: "/api/audios",
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
