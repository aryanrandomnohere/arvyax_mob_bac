const mongoose = require("mongoose");

/**
 * YogaPractice Model
 * Stores the practice library structure (sections/cards) for Asanas, Meditation, etc.
 * Used in wellness screen for browsing and selecting poses/practices
 */

// Sub-image schema for multiple images within a card
const CardImageSchema = new mongoose.Schema({
  imagePath: { type: String, required: true },
  cloudinaryId: { type: String, required: true },
  subId: { type: String, required: true },
  uniqueSubId: { type: String, required: true },
  audioUrl: { type: String, default: "" },
  audioId: { type: String, default: "" },
});

const CardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  repCount: { type: String, required: true },
  imagePath: { type: String, required: true },
  cloudinaryId: { type: String, required: true },
  videoUrl: { type: String, default: "" },
  exerciseTime: { type: String, default: "" },
  id: { type: String, required: true },
  uniqueId: { type: String, required: true },
  audioUrl: { type: String, default: "" },
  audioId: { type: String, default: "" },
  images: [CardImageSchema],
});

const SectionSchema = new mongoose.Schema({
  section: { type: String, required: true },
  uniqueId: { type: String, required: true },
  cards: [CardSchema],
});

const YogaPracticeSchema = new mongoose.Schema({
  practices: [SectionSchema],
  lastSectionCount: { type: Number, default: 0 },
  lastCardCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("YogaPractice", YogaPracticeSchema);
