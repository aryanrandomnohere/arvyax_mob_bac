import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { pingActivity } from "../controllers/activityController.js";
import { tryCatch, validateQuery } from "../utils/http.js";
import { calendarQuerySchema } from "../validation/activitySchemas.js";
import {
  getFeelingStreak,
  getActiveDaysCalendar,
} from "../controllers/feelingController.js";

const router = Router();

router.post("/ping", authMiddleware, tryCatch(pingActivity));
router.get("/streak", authMiddleware, tryCatch(getFeelingStreak));
router.get(
  "/calendar",
  authMiddleware,
  validateQuery(calendarQuerySchema),
  tryCatch(getActiveDaysCalendar)
);

export default router;
