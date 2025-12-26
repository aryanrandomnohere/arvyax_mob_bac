import express from "express";
import multer from "multer";
import * as ambienceAudioController from "../controllers/ambienceAudioController.js";

const router = express.Router();

/**
 * Ambience Audio Routes
 * Handles soundscape/ambience audio for "Sound escape" feature
 * Includes nature sounds, white noise, ambient music (rain, forest, campfire, etc.)
 */

// Configure multer for audio uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed!"), false);
    }
  },
});

// ============ SOUNDSCAPE/AMBIENCE AUDIO ROUTES ============

/**
 * GET /api/ambience-audios/get-ambience-audios
 * Get all ambience audio files with filtering
 * Query params: category?, tags?, limit?, page?
 * Returns: Paginated list of soundscape audio
 * Usage: Load "Sound escape" screen, filter by environment type
 * Example: ?category=nature&tags=rain,forest&limit=20&page=1
 */
router.get(
  "/get-ambience-audios",
  ambienceAudioController.getAllAmbienceAudios
); ///tested

/**
 * POST /api/ambience-audios/upload-ambience-audio
 * Upload new ambience audio file
 * Body: multipart/form-data with audioFile, title, duration?, category?, tags?
 * Files: audioFile (required)
 * Returns: Created audio object with R2 URL
 * Usage: Add new soundscape (rain, campfire, ocean waves, etc.)
 */
router.post(
  "/upload-ambience-audio",
  upload.single("audioFile"),
  ambienceAudioController.uploadAmbienceAudio
); ///tested

/**
 * POST /api/ambience-audios/upload-ambience-audio-url
 * Upload ambience audio via URL (legacy support)
 * Body: { title, url, r2Key, duration?, fileSize?, category?, tags? }
 * Returns: Created audio metadata
 * Usage: Backward compatibility for direct URL saves
 */
router.post(
  "/upload-ambience-audio-url",
  ambienceAudioController.uploadAmbienceAudioUrl
); ///what is ambience audio url

/**
 * DELETE /api/ambience-audios/delete-ambience-audio/:id
 * Delete ambience audio file
 * Removes audio from R2 and database
 * Params: id - MongoDB document ID
 * Returns: Success message with deletion status
 */
router.delete(
  "/delete-ambience-audio/:id",
  ambienceAudioController.deleteAmbienceAudio
); ///tested

/**
 * DELETE /api/ambience-audios/force-delete-ambience-audio/:id
 * Force delete ambience audio (ignores R2 errors)
 * Deletes from database even if R2 deletion fails
 * Params: id - MongoDB document ID
 * Returns: Success message
 */
router.delete(
  "/force-delete-ambience-audio/:id",
  ambienceAudioController.forceDeleteAmbienceAudio
); ///tested

/**
 * PUT /api/ambience-audios/update-ambience-audio/:id
 * Update ambience audio metadata
 * Body: { title, category?, tags? }
 * Params: id - MongoDB document ID
 * Returns: Updated audio object
 */
router.put(
  "/update-ambience-audio/:id",
  ambienceAudioController.updateAmbienceAudio
); // not tested but probably works

/**
 * GET /api/ambience-audios/ambience-audio-info/:id
 * Get detailed ambience audio information
 * Params: id - MongoDB document ID
 * Returns: Complete audio object with all metadata
 */
router.get(
  "/ambience-audio-info/:id",
  ambienceAudioController.getAmbienceAudioInfo
); //tested

// ============ CATEGORY & TAG MANAGEMENT ============

/**
 * GET /api/ambience-audios/ambience-categories
 * Get all available ambience categories
 * Returns: Array of category names
 * Usage: Populate category filter dropdown
 */
router.get(
  "/ambience-categories",
  ambienceAudioController.getAmbienceCategories
); // worked but returned empty array

/**
 * GET /api/ambience-audios/ambience-tags
 * Get all available ambience tags
 * Returns: Array of tag names
 * Usage: Populate tag filter chips/pills
 */
router.get("/ambience-tags", ambienceAudioController.getAmbienceTags); ///tested

// ============ UTILITY ROUTES ============

/**
 * GET /api/ambience-audios/test-r2-connection
 * Test R2 cloud storage connection for ambience audio
 * Returns: Connection status, bucket info, sample files
 */
router.get("/test-r2-connection", ambienceAudioController.testR2Connection); ///tested for some reason this is same as the audi/test-r2-connection

/**
 * GET /api/ambience-audios/storage-stats
 * Get storage statistics
 * Returns: Total audio count, total size, average size
 * Usage: Admin dashboard, storage monitoring
 */
router.get("/storage-stats", ambienceAudioController.getStorageStats); ///tested

export default router;
