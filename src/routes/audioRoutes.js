const express = require("express");
const router = express.Router();
const multer = require("multer");
const audioController = require("../controllers/audioController");

/**
 * Audio Routes
 * Handles mindfulness/meditation/breath work audio files
 * Used for: Guided meditation, box breathing, sound therapy, mindfulness exercises
 */

// Configure multer for audio and thumbnail uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("audio/") ||
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files and images are allowed!"), false);
    }
  },
});

// ============ MINDFULNESS AUDIO ROUTES ============

/**
 * GET /api/audios/get-audios
 * Get all mindfulness/meditation audio files
 * Returns: Array of all audio files with thumbnails
 * Usage: Load meditation library, breath work exercises
 */
router.get("/get-audios", audioController.getAllAudios);

/**
 * POST /api/audios/upload-audio
 * Upload new audio file with optional thumbnail
 * Body: multipart/form-data with audioFile, thumbnail?, title, duration?
 * Files: audioFile (required), thumbnail (optional)
 * Returns: Created audio object with R2 URLs
 * Usage: Add new guided meditation or breath work audio
 */
router.post(
  "/upload-audio",
  upload.fields([
    { name: "audioFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  audioController.uploadAudio
);

/**
 * POST /api/audios/upload-audio-url
 * Upload audio via URL (legacy support)
 * Body: { title, url, thumbnailUrl, r2Key, thumbnailR2Key, duration?, fileSize? }
 * Returns: Created audio metadata
 * Usage: Backward compatibility for direct URL saves
 */
router.post("/upload-audio-url", audioController.uploadAudioUrl);

/**
 * DELETE /api/audios/delete-audio/:id
 * Delete audio file
 * Removes audio and thumbnail from R2 and database
 * Params: id - MongoDB document ID
 * Returns: Success message with deletion status
 */
router.delete("/delete-audio/:id", audioController.deleteAudio);

/**
 * DELETE /api/audios/force-delete-audio/:id
 * Force delete audio (ignores R2 errors)
 * Deletes from database even if R2 deletion fails
 * Params: id - MongoDB document ID
 * Returns: Success message
 */
router.delete("/force-delete-audio/:id", audioController.forceDeleteAudio);

/**
 * PUT /api/audios/update-audio/:id
 * Update audio metadata
 * Body: { title }
 * Params: id - MongoDB document ID
 * Returns: Updated audio object
 */
router.put("/update-audio/:id", audioController.updateAudio);

/**
 * GET /api/audios/audio-info/:id
 * Get detailed audio information
 * Params: id - MongoDB document ID
 * Returns: Complete audio object with all metadata
 */
router.get("/audio-info/:id", audioController.getAudioInfo);

/**
 * GET /api/audios/test-r2-connection
 * Test R2 cloud storage connection
 * Returns: Connection status and bucket info
 */
router.get("/test-r2-connection", audioController.testR2Connection);

module.exports = router;
