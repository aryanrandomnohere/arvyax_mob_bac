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
  getTodayFeelingLogs,
  getDayFeelingTimeline,
} from "../controllers/feelingController.js";

const router = Router();

router.post(
  "/start",
  authMiddleware,
  validateBody(startFeelingSchema),
  tryCatch(startFeeling)
);

router.post("/end", authMiddleware, tryCatch(endFeeling));
router.get("/current", authMiddleware, tryCatch(getCurrentFeeling));
router.get("/today", authMiddleware, tryCatch(getTodayFeelingLogs));
router.get(
  "/day",
  authMiddleware,
  validateQuery(dayTimelineQuerySchema),
  tryCatch(getDayFeelingTimeline)
);

export default router;
