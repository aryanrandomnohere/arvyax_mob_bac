import express from "express";
import * as breathingController from "../controllers/breathingController.js";

const router = express.Router();

/**
 * Breathing Routes
 * Handles mindfulness breathing exercises
 * Used for: Triangle breathing, Line breathing, Box breathing, Infinity breathing, Shuffle breathing
 */

/**
 * GET /api/breathing/box/all
 * Get all breathing exercises with their video URLs
 * Returns: Array of all breathing types with videos
 */
router.get("/box/all", breathingController.getAllBreathing);

/**
 * GET /api/breathing/exercises/short
 * Get all short breathing exercises (< 15 minutes)
 * Returns: Array of short breathing exercise videos
 * Exercises: Alternate Nostril, Breathe In Nature, Deep Chest Breathing
 */
router.get("/exercises/short", breathingController.getShortBreathingExercises);

/**
 * GET /api/breathing/exercises/long
 * Get all long breathing exercises (>= 15 minutes)
 * Returns: Array of long breathing exercise videos
 * Exercises: Morning Breath
 */
router.get("/exercises/long", breathingController.getLongBreathingExercises);

/**
 * GET /api/breathing/box/:type
 * Get breathing exercise by type initials (triangle, line, square, infinity, shuffle)
 * Returns: Breathing type with all videos
 */
router.get("/box/:type", breathingController.getBreathingByType);

export default router;
