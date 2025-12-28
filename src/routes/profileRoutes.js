import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { tryCatch, validateBody } from "../utils/http.js";

import {
  getMyProfile,
  updateMyProfile,
  getAmbiencePreferences,
  setAmbiencePreference,
} from "../controllers/profileController.js";

import { setAmbienceSelectionSchema } from "../validation/authSchemas.js";
import { updateProfileSchema } from "../validation/profileSchemas.js";

const router = express.Router();

/**
 * Profile & Preferences Routes
 *
 * Mounted under: /api/
 *
 * Why here?
 * - These routes all operate on the "current logged-in user".
 * - They require authMiddleware.
 */

// -------------------------
//          PROFILE
// -------------------------

/**
 * GET /api/auth/profile
 * Returns profile details used by the app:
 * - name (username)
 * - dob, gender
 * - currentFeeling (open feeling log)
 * - currentStreak (consecutive active days)
 * - badges (earned badges)
 * - streakBadges (all streak badges with isEarned)
 */
router.get("/profile", authMiddleware, tryCatch(getMyProfile));

/**
 * PUT /api/auth/profile
 * Updates profile fields: name, dob, gender.
 */
router.put(
  "/profile",
  authMiddleware,
  validateBody(updateProfileSchema),
  tryCatch(updateMyProfile)
);

// -------------------------
//        PREFERENCES
// -------------------------

/**
 * GET /api/auth/preferences/ambience
 * Reads the user's saved ambience selections and hydrates theme metadata.
 */
router.get(
  "/preferences/ambience",
  authMiddleware,
  tryCatch(getAmbiencePreferences)
);

/**
 * PUT /api/auth/preferences/ambience
 * Saves a user's selected theme for a given category.
 * Body: { categoryId, themeId }
 */
router.put(
  "/preferences/ambience",
  authMiddleware,
  validateBody(setAmbienceSelectionSchema),
  tryCatch(setAmbiencePreference)
);

export default router;
