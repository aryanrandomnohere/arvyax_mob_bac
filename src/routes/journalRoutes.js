import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { tryCatch, validateBody, validateQuery } from "../utils/http.js";

import {
  getJournalForDate,
  createJournalTask,
  updateJournalTask,
} from "../controllers/journalController.js";

import {
  createJournalTaskSchema,
  journalDateQuerySchema,
  updateJournalTaskSchema,
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

// Create a new task for a day (defaults to today).
router.post(
  "/journal/tasks",
  authMiddleware,
  validateBody(createJournalTaskSchema),
  tryCatch(createJournalTask)
);

// Mark a task completed / uncompleted.
router.patch(
  "/journal/tasks/:taskId",
  authMiddleware,
  validateBody(updateJournalTaskSchema),
  tryCatch(updateJournalTask)
);

export default router;
