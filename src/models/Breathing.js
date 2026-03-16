import mongoose from "mongoose";

const { Schema } = mongoose;

const BreathingSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "triangle",
        "line",
        "square",
        "infinity",
        "shuffle",
        "circle",
        "alternateNostril",
        "breatheInNature",
        "deepChestBreathing",
        "morningBreath",
      ],
      index: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    videos: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    category: {
      type: String,
      default: "mindfulness",
      trim: true,
    },

    duration: {
      type: String,
      enum: ["short", "long"],
      default: "short",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Breathing", BreathingSchema);
