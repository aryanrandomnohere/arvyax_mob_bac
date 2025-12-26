import express from "express";
const router = express.Router();
import * as ambienceCommandController from "../controllers/ambienceCommandController.js";

/**
 * Ambience Command Routes
 * Manages BLE/timed commands for soundscape environments
 * Controls LED lighting, sound mixing, and ambience transitions
 * Each environment (rain, campfire, forest) has starting/middle/ending command sequences
 */

// ============ AMBIENCE COMMAND MANAGEMENT ============

/**
 * GET /api/ambience-commands
 * Get all ambience command sets
 * Returns: List of all environment command configurations
 * Usage: Load available soundscape environments
 * Response includes: environment name, duration, file size, command count
 */
router.get("/", ambienceCommandController.getAllAmbienceCommands); ///tested

/**
 * GET /api/ambience-commands/:environment
 * Get commands for specific environment
 * Params: environment - Environment name (e.g., rain, campfire, forest)
 * Returns: Complete command set with starting/middle/ending sequences
 * Usage: Load BLE commands when user starts soundscape session
 * Example: /ambience-commands/rain
 */
router.get(
  "/:environment",
  ambienceCommandController.getAmbienceCommandsByEnvironment
); ///tested

// ============ CREATE/UPDATE/DELETE COMMAND SETS ============

/**
 * POST /api/ambience-commands
 * Create new ambience command set
 * Body: { environment, mainDuration, starting[], middle[], ending[] }
 * Returns: Created command set with Cloudflare URL
 * Usage: Add new soundscape environment with BLE commands
 * Command format: [{ second: number, value: hex_string }]
 */
router.post("/", ambienceCommandController.createAmbienceCommands); ///tested

/**
 * PUT /api/ambience-commands/:environment
 * Update existing ambience command set
 * Body: { mainDuration?, starting[], middle[], ending[] }
 * Params: environment - Environment name to update
 * Returns: Updated command set
 * Usage: Modify BLE sequence for existing soundscape
 */
router.put("/:environment", ambienceCommandController.updateAmbienceCommands); //tested

/**
 * DELETE /api/ambience-commands/:environment
 * Delete ambience command set
 * Removes commands from database and R2 storage
 * Params: environment - Environment name to delete
 * Returns: Success message
 */
router.delete(
  "/:environment",
  ambienceCommandController.deleteAmbienceCommands
); ///tested

// ============ BULK OPERATIONS ============

/**
 * POST /api/ambience-commands/bulk-upload
 * Bulk upload/update multiple command sets
 * Body: { commands: [{ environment, mainDuration, starting[], middle[], ending[] }] }
 * Returns: Summary with success/failure counts
 * Usage: Import multiple soundscape configurations at once
 */
router.post(
  "/bulk-upload",
  ambienceCommandController.bulkUploadAmbienceCommands
); /// most probably it will work

// ============ STATISTICS & SEARCH ============

/**
 * GET /api/ambience-commands/stats/overview
 * Get command statistics overview
 * Returns: Total environments, total commands, total size, last updated
 * Usage: Admin dashboard, monitoring
 */
router.get(
  "/stats/overview",
  ambienceCommandController.getAmbienceCommandsStats
); ///tested

/**
 * GET /api/ambience-commands/search/query
 * Search ambience commands
 * Query params: q? (environment name), minDuration?, maxDuration?
 * Returns: Filtered list of command sets
 * Usage: Search/filter soundscapes by name or duration
 * Example: ?q=rain&minDuration=300&maxDuration=600
 */
router.get("/search/query", ambienceCommandController.searchAmbienceCommands); ///tested

export default router;
