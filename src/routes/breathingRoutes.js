import express from "express";
import * as breathingController from "../controllers/breathingController.js";

const router = express.Router();

/**
 * Breathing Routes
 * Handles mindfulness breathing exercises
 * Used for: Triangle breathing, Line breathing, Box breathing, Infinity breathing, Shuffle breathing
 */

/**
 * GET /api/breathing/all
 * Get all breathing exercises with their video URLs
 * Returns: Array of all breathing types with videos
 */
router.get("/all", breathingController.getAllBreathing);

/**
 * GET /api/breathing/:type
 * Get breathing exercise by type initials (triangle, line, square, infinity, shuffle)
 * Returns: Breathing type with all videos
 */
router.get("/:type", breathingController.getBreathingByType);

export default router;
