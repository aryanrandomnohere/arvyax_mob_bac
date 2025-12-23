const mongoose = require("mongoose");

/**
 * AmbienceAudio Model
 * Stores soundscape/ambience audio for "Sound escape" feature
 * Includes categories and tags for filtering (rain, forest, campfire, etc.)
 */
const AmbienceAudioSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  r2Key: { type: String, required: true },
  duration: { type: Number }, // in seconds
  fileSize: { type: Number }, // in bytes
  mimeType: { type: String },
  category: { type: String, default: "ambience" },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AmbienceAudio", AmbienceAudioSchema);
