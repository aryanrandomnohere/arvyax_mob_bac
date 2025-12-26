import express from "express";
import * as yogaPracticeController from "../controllers/yogaPracticeController.js";
const router = express.Router();

/**
 * Yoga Practice Routes
 * Manages the practice library structure (sections & cards)
 * Used for browsing Asanas, Meditation poses, and building custom practices
 */

// ============ PRACTICE LIBRARY ROUTES ============

/**
 * GET /api/practices/get-yoga-practices
 * Get complete practice library structure
 * Returns: All sections with cards (Asana, Meditation, Pranayam, etc.)
 * Usage: Load the main wellness screen practice selector
 */
router.get("/get-yoga-practices", yogaPracticeController.getAllYogaPractices);

/**
 * POST /api/practices/migrate-audio-ids
 * Migrate/add audio IDs to existing practices
 * Auto-generates audio IDs for cards missing them
 * Returns: Count of updated items
 */
router.post("/migrate-audio-ids", yogaPracticeController.migrateAudioIds);

/**
 * POST /api/practices/upload-practice-image
 * Upload new practice card with image
 * Body: { title, repCount, section, url, cloudinaryId, id?, videoUrl?, exerciseTime?, audioUrl? }
 * Returns: Updated practice structure
 * Usage: Add new pose/meditation card to a section
 */
router.post(
  "/upload-practice-image",
  yogaPracticeController.uploadPracticeImage
);

/**
 * POST /api/practices/add-section
 * Create new practice section
 * Body: { sectionName }
 * Returns: Updated practice with new section
 * Usage: Add new category (e.g., "Advanced Asanas")
 */
router.post("/add-section", yogaPracticeController.addSection);

/**
 * DELETE /api/practices/delete-practice-image/:sectionName/:cardId
 * Delete practice card/image
 * Removes card from section and deletes from Cloudinary
 * Params: sectionName, cardId
 * Returns: Success message
 */
router.delete(
  "/delete-practice-image/:sectionName/:cardId",
  yogaPracticeController.deletePracticeImage
);

/**
 * PUT /api/practices/update-card/:sectionName/:cardId
 * Update card details
 * Body: { title, repCount, videoUrl?, exerciseTime?, audioUrl? }
 * Params: sectionName, cardId
 * Returns: Updated practice structure
 * Usage: Edit existing pose/meditation card
 */
router.put(
  "/update-card/:sectionName/:cardId",
  yogaPracticeController.updateCard
);

/**
 * DELETE /api/practices/delete-section/:sectionName
 * Delete entire section with all cards
 * Removes section and deletes all images from Cloudinary
 * Params: sectionName
 * Returns: Success message with Cloudinary results
 */
router.delete(
  "/delete-section/:sectionName",
  yogaPracticeController.deleteSection
);

// ============ MULTI-IMAGE CARD ROUTES ============
// For cards with multiple images (pose variations, A/B/C images)

/**
 * POST /api/practices/upload-card-image/:sectionName/:cardId
 * Add additional image to existing card
 * Creates sub-images (A, B, C, etc.) for pose variations
 * Body: { url, cloudinaryId, audioUrl? }
 * Params: sectionName, cardId
 * Returns: Updated practice with new sub-image
 */
router.post(
  "/upload-card-image/:sectionName/:cardId",
  yogaPracticeController.uploadCardImage
);

/**
 * DELETE /api/practices/delete-card-image/:sectionName/:cardId/:subId
 * Delete specific sub-image from card
 * Removes one variation image (A, B, C, etc.)
 * Params: sectionName, cardId, subId
 * Returns: Success message
 */
router.delete(
  "/delete-card-image/:sectionName/:cardId/:subId",
  yogaPracticeController.deleteCardImage
);

/**
 * PUT /api/practices/update-card-image/:sectionName/:cardId/:subId
 * Update specific sub-image
 * Replaces existing variation image
 * Body: { url, cloudinaryId, audioUrl? }
 * Params: sectionName, cardId, subId
 * Returns: Updated practice structure
 */
router.put(
  "/update-card-image/:sectionName/:cardId/:subId",
  yogaPracticeController.updateCardImage
);

export default router;
