const express = require("express");
const router = express.Router();
const ambienceCommandController = require("../controllers/ambienceCommandController");

/**
 * Ambience Command Routes
 * Manages BLE/timed commands for soundscape environments
 * Controls LED lighting, sound mixing, and ambience transitions
 * Each environment (rain, campfire, forest) has starting/middle/ending command sequences
 */

// ============ AMBIENCE COMMAND MANAGEMENT ============

/**
 * GET /api/ambience-commands/ambience-commands
 * Get all ambience command sets
 * Returns: List of all environment command configurations
 * Usage: Load available soundscape environments
 * Response includes: environment name, duration, file size, command count
 */
router.get(
  "/ambience-commands",
  ambienceCommandController.getAllAmbienceCommands
);

/**
 * GET /api/ambience-commands/ambience-commands/:environment
 * Get commands for specific environment
 * Params: environment - Environment name (e.g., rain, campfire, forest)
 * Returns: Complete command set with starting/middle/ending sequences
 * Usage: Load BLE commands when user starts soundscape session
 * Example: /ambience-commands/rain
 */
router.get(
  "/ambience-commands/:environment",
  ambienceCommandController.getAmbienceCommandsByEnvironment
);

/**
 * POST /api/ambience-commands/ambience-commands
 * Create new ambience command set
 * Body: { environment, mainDuration, starting[], middle[], ending[] }
 * Returns: Created command set with Cloudflare URL
 * Usage: Add new soundscape environment with BLE commands
 * Command format: [{ second: number, value: hex_string }]
 */
router.post(
  "/ambience-commands",
  ambienceCommandController.createAmbienceCommands
);

/**
 * PUT /api/ambience-commands/ambience-commands/:environment
 * Update existing ambience command set
 * Body: { mainDuration?, starting[], middle[], ending[] }
 * Params: environment - Environment name to update
 * Returns: Updated command set
 * Usage: Modify BLE sequence for existing soundscape
 */
router.put(
  "/ambience-commands/:environment",
  ambienceCommandController.updateAmbienceCommands
);

/**
 * DELETE /api/ambience-commands/ambience-commands/:environment
 * Delete ambience command set
 * Removes commands from database and R2 storage
 * Params: environment - Environment name to delete
 * Returns: Success message
 */
router.delete(
  "/ambience-commands/:environment",
  ambienceCommandController.deleteAmbienceCommands
);

// ============ BULK OPERATIONS ============

/**
 * POST /api/ambience-commands/ambience-commands/bulk-upload
 * Bulk upload/update multiple command sets
 * Body: { commands: [{ environment, mainDuration, starting[], middle[], ending[] }] }
 * Returns: Summary with success/failure counts
 * Usage: Import multiple soundscape configurations at once
 */
router.post(
  "/ambience-commands/bulk-upload",
  ambienceCommandController.bulkUploadAmbienceCommands
);

// ============ STATISTICS & SEARCH ============

/**
 * GET /api/ambience-commands/ambience-commands/stats/overview
 * Get command statistics overview
 * Returns: Total environments, total commands, total size, last updated
 * Usage: Admin dashboard, monitoring
 */
router.get(
  "/ambience-commands/stats/overview",
  ambienceCommandController.getAmbienceCommandsStats
);

/**
 * GET /api/ambience-commands/ambience-commands/search/query
 * Search ambience commands
 * Query params: q? (environment name), minDuration?, maxDuration?
 * Returns: Filtered list of command sets
 * Usage: Search/filter soundscapes by name or duration
 * Example: ?q=rain&minDuration=300&maxDuration=600
 */
router.get(
  "/ambience-commands/search/query",
  ambienceCommandController.searchAmbienceCommands
);

module.exports = router;
