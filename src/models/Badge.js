import mongoose from "mongoose";

const { Schema } = mongoose;

const BadgeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    criteria: {
      type: String,
      default: "",
      trim: true,
    },

    level: {
      type: Number,
      default: 1,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    milestoneDays: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

BadgeSchema.index({ isActive: 1, order: 1 });

BadgeSchema.statics.getActiveBadges = function () {
  return this.find({ isActive: true }).sort({ order: 1, level: 1 });
};

const Badge = mongoose.model("Badge", BadgeSchema);

export default Badge;
