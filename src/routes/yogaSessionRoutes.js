import express from "express";
import multer from "multer";
import * as yogaSessionController from "../controllers/yogaSessionController.js";
const router = express.Router();

/**
 * Yoga Session Routes
 * Handles session JSONs for "Start Session" feature in wellness screen
 * Each session contains complete practice flow with poses, timing, and instructions
 */

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for JSON files
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/json" ||
      file.originalname.endsWith(".json")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only JSON files are allowed!"), false);
    }
  },
});

// ============ YOGA SESSION ROUTES ============

/**
 * GET /api/json/get-yoga-sessions
 * Get all yoga sessions
 * Returns: Array of all session JSONs with metadata
 */
router.get("/get-yoga-sessions", yogaSessionController.getAllYogaSessions);

/**
 * GET /api/json/get-yoga-sessions/:sectionId
 * Get yoga sessions by section (Asana/Meditation/etc.)
 * Params: sectionId - The section identifier (e.g., S21 for Asana)
 * Returns: Array of sessions filtered by section
 */
router.get(
  "/get-yoga-sessions/:sectionId",
  yogaSessionController.getYogaSessionsBySection
);

/**
 * POST /api/json/upload-yoga-session
 * Upload new yoga session JSON file
 * Body: multipart/form-data with jsonFile, title, sectionId, uniqueId, cardId
 * Returns: Created session with R2 URL
 */
router.post(
  "/upload-yoga-session",
  upload.single("jsonFile"),
  yogaSessionController.uploadYogaSession
);

/**
 * POST /api/json/upload-yoga-session-url
 * Upload yoga session via URL (legacy support)
 * Body: { title, sectionId, uniqueId, cardId, url, r2Key, fileSize }
 * Returns: Created session metadata
 */
router.post(
  "/upload-yoga-session-url",
  yogaSessionController.uploadYogaSessionUrl
);

/**
 * DELETE /api/json/delete-yoga-session/:id
 * Delete yoga session
 * Removes session from database and R2 storage
 * Params: id - MongoDB document ID
 * Returns: Success message with deletion status
 */
router.delete(
  "/delete-yoga-session/:id",
  yogaSessionController.deleteYogaSession
);

/**
 * DELETE /api/json/force-delete-yoga-session/:id
 * Force delete yoga session (ignores R2 errors)
 * Deletes from database even if R2 deletion fails
 * Params: id - MongoDB document ID
 * Returns: Success message
 */
router.delete(
  "/force-delete-yoga-session/:id",
  yogaSessionController.forceDeleteYogaSession
);

/**
 * PUT /api/json/update-yoga-session/:id
 * Update yoga session metadata
 * Body: { title, sectionId?, uniqueId?, cardId? }
 * Params: id - MongoDB document ID
 * Returns: Updated session object
 */
router.put("/update-yoga-session/:id", yogaSessionController.updateYogaSession);

/**
 * GET /api/json/yoga-session-info/:id
 * Get detailed session information
 * Params: id - MongoDB document ID
 * Returns: Complete session object
 */
router.get("/yoga-session-info/:id", yogaSessionController.getYogaSessionInfo);

/**
 * GET /api/json/test-r2-connection
 * Test R2 cloud storage connection
 * Returns: Connection status and bucket info
 */
router.get("/test-r2-connection", yogaSessionController.testR2Connection);

export default router;
