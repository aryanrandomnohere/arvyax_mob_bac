import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { tryCatch } from "../utils/http.js";
import { getStreakLeaderboard } from "../controllers/leaderboardController.js";

const router = express.Router();

/**
 * Leaderboard Routes
 *
 * Mounted under: /api/
 */

/**
 * GET /api/leaderboard/streak
 * Returns users sorted by current streak (desc).
 * Optional query: ?limit=100 (1..200)
 */
router.get(
  "/leaderboard/streak",
  authMiddleware,
  tryCatch(getStreakLeaderboard)
);

export default router;
