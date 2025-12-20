import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { tryCatch, validateBody, validateQuery } from "../utils/http.js";
import {
  startFeelingSchema,
  dayTimelineQuerySchema,
} from "../validation/feelingSchemas.js";
import {
  startFeeling,
  endFeeling,
  getCurrentFeeling,
  getFeelingLogs,
  getTodayFeelingLogs,
  getDayFeelingTimeline,
} from "../controllers/feelingController.js";

const router = Router();

// Start a new feeling session (closes any open session)
router.post(
  "/start",
  authMiddleware,
  validateBody(startFeelingSchema),
  tryCatch(startFeeling)
);

// End the current open feeling session
router.post("/end", authMiddleware, tryCatch(endFeeling));

// Get current feeling (open session if exists, else last)
router.get("/current", authMiddleware, tryCatch(getCurrentFeeling));

// Get today's logs (UTC day)
router.get("/today", authMiddleware, tryCatch(getTodayFeelingLogs));

// Get a specific day's feeling timeline (UTC): ?date=YYYY-MM-DD
router.get(
  "/day",
  authMiddleware,
  validateQuery(dayTimelineQuerySchema),
  tryCatch(getDayFeelingTimeline)
);

export default router;
