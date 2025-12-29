import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { tryCatch, validateBody, validateQuery } from "../utils/http.js";

import {
  getJournalForDate,
  getActiveJournals,
  upsertJournalTasksForDate,
  listIncompleteJournalDays,
  appendJournalTaskForDate,
  updateJournalTaskStatus,
  upsertJournalQuestionsForDate,
} from "../controllers/journalController.js";

import {
  journalDateQuerySchema,
  upsertJournalTasksSchema,
  appendJournalTaskSchema,
  updateJournalTaskStatusSchema,
  upsertJournalQuestionsSchema,
} from "../validation/journalSchemas.js";

const router = express.Router();

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
  tryCatch(getJournalForDate)
);

// Get today's journal + all days with any incomplete tasks.
router.get("/journal/active", authMiddleware, tryCatch(getActiveJournals));

// Create/replace the 5 tasks for a day (defaults to today).
router.post(
  "/journal/tasks/batch",
  authMiddleware,
  validateBody(upsertJournalTasksSchema),
  tryCatch(upsertJournalTasksForDate)
);

// List days where at least one task is not completed.
router.get(
  "/journal/incomplete",
  authMiddleware,
  tryCatch(listIncompleteJournalDays)
);

// Append a new task to a day (defaults to today).
router.post(
  "/journal/tasks",
  authMiddleware,
  validateBody(appendJournalTaskSchema),
  tryCatch(appendJournalTaskForDate)
);

// Update task status.
router.patch(
  "/journal/tasks/:taskId",
  authMiddleware,
  validateBody(updateJournalTaskStatusSchema),
  tryCatch(updateJournalTaskStatus)
);

// Upsert daily questions for a day (defaults to today).
router.put(
  "/journal/questions",
  authMiddleware,
  validateBody(upsertJournalQuestionsSchema),
  tryCatch(upsertJournalQuestionsForDate)
);

export default router;
