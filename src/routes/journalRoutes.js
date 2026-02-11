import express from "express";
import multer from "multer";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { tryCatch, validateBody, validateQuery } from "../utils/http.js";

import {
  getJournalForDate,
  getActiveJournals,
  getJournalHistory,
  upsertJournalTasksForDate,
  listIncompleteJournalDays,
  appendJournalTaskForDate,
  updateJournalTaskStatus,
  upsertJournalQuestionsForDate,
  getTotalTaskStats,
  getAverageDailyTaskStats,
  getJournalMilestones,
  getJournalLearnings,
  getDailyQuestionStats,
  getMonthlyTaskDaysFilled,
} from "../controllers/journalController.js";

import {
  journalDateQuerySchema,
  upsertJournalTasksSchema,
  appendJournalTaskSchema,
  updateJournalTaskStatusSchema,
  upsertJournalQuestionsSchema,
  journalMonthQuerySchema,
} from "../validation/journalSchemas.js";

const router = express.Router();

// Multer for optional journal photo uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype?.startsWith("image/")) return cb(null, true);
    cb(new Error("Only image files are allowed"), false);
  },
});

// If multipart/form-data is used, allow passing JSON as a `payload` field.
const parseMultipartPayload = (req, res, next) => {
  if (!req.is("multipart/form-data")) return next();

  if (req.body?.payload) {
    try {
      req.body = JSON.parse(req.body.payload);
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON in payload" });
    }
    return next();
  }

  // Fallback: accept flat fields
  const aboutIt =
    req.body?.aboutIt ?? req.body?.["anythingSpecialHappenedToday.aboutIt"];
  let photos = [];
  const rawPhotos =
    req.body?.photos ?? req.body?.["anythingSpecialHappenedToday.photos"];
  if (typeof rawPhotos === "string" && rawPhotos.trim()) {
    try {
      const parsed = JSON.parse(rawPhotos);
      if (Array.isArray(parsed)) photos = parsed;
    } catch {
      photos = rawPhotos
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  req.body = {
    dateKey: req.body?.dateKey,
    mistakes: req.body?.mistakes ?? "",
    whatDidYouLearn: req.body?.whatDidYouLearn ?? "",
    anythingSpecialHappenedToday: {
      aboutIt: aboutIt ?? "",
      photos,
    },
  };

  return next();
};

/**
 * Journal Routes
 *
 * Mounted under: /api/
 */

// Get daily journal (tasks carry-forward).
router.get(
  "/journal",
  authMiddleware,
  validateQuery(journalDateQuerySchema),
  tryCatch(getJournalForDate),
);

// Get today's journal + all days with any incomplete tasks.
router.get("/journal/active", authMiddleware, tryCatch(getActiveJournals));

// Get all journal entries (newest first).
router.get("/journal/history", authMiddleware, tryCatch(getJournalHistory));

// Create/replace the 5 tasks for a day (defaults to today).
router.post(
  "/journal/tasks/batch",
  authMiddleware,
  validateBody(upsertJournalTasksSchema),
  tryCatch(upsertJournalTasksForDate),
);

// List days where at least one task is not completed.
router.get(
  "/journal/incomplete",
  authMiddleware,
  tryCatch(listIncompleteJournalDays),
);

// Append a new task to a day (defaults to today).
router.post(
  "/journal/tasks",
  authMiddleware,
  validateBody(appendJournalTaskSchema),
  tryCatch(appendJournalTaskForDate),
);

// Update task status.
router.patch(
  "/journal/tasks/:taskId",
  authMiddleware,
  validateBody(updateJournalTaskStatusSchema),
  tryCatch(updateJournalTaskStatus),
);

// Upsert daily questions for a day (defaults to today).
router.put(
  "/journal/questions",
  authMiddleware,
  upload.fields([
    { name: "image", maxCount: 10 },
    { name: "images", maxCount: 10 },
  ]),
  parseMultipartPayload,
  validateBody(upsertJournalQuestionsSchema),
  tryCatch(upsertJournalQuestionsForDate),
);

// Get total tasks statistics.
router.get(
  "/journal/stats/total-tasks",
  authMiddleware,
  tryCatch(getTotalTaskStats),
);

// Get average daily tasks statistics.
router.get(
  "/journal/stats/average-daily-tasks",
  authMiddleware,
  tryCatch(getAverageDailyTaskStats),
);

// Get all milestones (anythingSpecialHappenedToday) by day.
router.get(
  "/journal/milestones",
  authMiddleware,
  tryCatch(getJournalMilestones),
);

// Get all learnings (whatDidYouLearn) by day.
router.get("/journal/learnings", authMiddleware, tryCatch(getJournalLearnings));

// Get stats for days with learning/mistakes answers.
router.get(
  "/journal/stats/daily-questions",
  authMiddleware,
  tryCatch(getDailyQuestionStats),
);

// Get monthly days with tasks filled.
router.get(
  "/journal/stats/monthly-days",
  authMiddleware,
  validateQuery(journalMonthQuerySchema),
  tryCatch(getMonthlyTaskDaysFilled),
);

export default router;
