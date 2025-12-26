import mongoose from "mongoose";

/**
 * Audio Model
 * Stores mindfulness/meditation/breath work audio files
 * Used in wellness screen for guided meditation, box breathing, etc.
 */
const AudioSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  r2Key: { type: String, required: true },
  thumbnailR2Key: { type: String, required: true },
  duration: { type: Number }, // in seconds
  fileSize: { type: Number }, // in bytes
  mimeType: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Audio = mongoose.model("Audio", AudioSchema);

export default Audio;
