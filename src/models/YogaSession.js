const mongoose = require("mongoose");

/**
 * YogaSession Model
 * Stores yoga practice session JSONs for the wellness screen "Start Session" feature
 * Each session contains timed poses, instructions, and flow data
 */
const YogaSessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sectionId: { type: String, required: true },
  uniqueId: { type: String, required: true },
  cardId: { type: String, required: true },
  url: { type: String, required: true },
  r2Key: { type: String, required: true },
  fileSize: { type: Number }, // in bytes
  mimeType: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("YogaSession", YogaSessionSchema);
