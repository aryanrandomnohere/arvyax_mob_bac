import mongoose from "mongoose";

/**
 * YogaPoseList Model
 * Preserves the legacy yoga pose list structure from the old backend.
 * Each document represents a section that contains pose cards.
 */

const yogaPoseCardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    repCount: {
      type: String,
      required: true,
    },
    imagePath: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    uniqueId: {
      type: String,
      required: true,
      unique: true,
    },
    cardId: {
      type: String,
      required: true,
    },
    sectionId: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const yogaPoseSectionSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: true,
      trim: true,
    },
    uniqueId: {
      type: String,
      required: true,
      unique: true,
    },
    cards: [yogaPoseCardSchema],
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

yogaPoseSectionSchema.index({ uniqueId: 1 });
yogaPoseSectionSchema.index({ "cards.uniqueId": 1 });

export default mongoose.model("YogaPoseList", yogaPoseSectionSchema);