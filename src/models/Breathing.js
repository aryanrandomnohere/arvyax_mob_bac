import mongoose from "mongoose";

const { Schema } = mongoose;

const BreathingSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "triangleBreathing",
        "lineBreathing",
        "boxBreathing",
        "infinityBreathing",
        "shuffleBreathing",
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
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Breathing", BreathingSchema);
