import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { pingActivity } from "../controllers/activityController.js";
import { tryCatch, validateQuery } from "../utils/http.js";
import { calendarQuerySchema } from "../validation/activitySchemas.js";
import {
  getFeelingStreak,
  getActiveDaysCalendar,
  //   getStreakBadges,
} from "../controllers/feelingController.js";

const router = Router();

// User hits this whenever they enter/open the app
router.post("/ping", authMiddleware, tryCatch(pingActivity));

// Moved from FeelingRoutes -> ActivityRoutes
router.get("/streak", authMiddleware, tryCatch(getFeelingStreak));
router.get(
  "/calendar",
  authMiddleware,
  validateQuery(calendarQuerySchema),
  tryCatch(getActiveDaysCalendar)
);
// router.get("/badges", authMiddleware, getStreakBadges);

export default router;
