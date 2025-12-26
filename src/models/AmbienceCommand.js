import mongoose from "mongoose";

/**
 * AmbienceCommand Model
 * Stores BLE/timed commands for soundscape environments
 * Controls LED lighting, sound mixing, and ambience transitions
 */
const CommandSchema = new mongoose.Schema({
  second: {
    type: Number,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
});

const AmbienceCommandSchema = new mongoose.Schema({
  environment: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  mainDuration: {
    type: Number,
    required: true,
    default: 300,
  },
  starting: {
    type: [CommandSchema],
    default: [],
  },
  middle: {
    type: [CommandSchema],
    default: [],
  },
  ending: {
    type: [CommandSchema],
    default: [],
  },
  cloudflareUrl: {
    type: String,
  },
  size: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual field for total commands count
AmbienceCommandSchema.virtual("totalCommands").get(function () {
  return (
    (this.starting?.length || 0) +
    (this.middle?.length || 0) +
    (this.ending?.length || 0)
  );
});

// Update timestamp on save
AmbienceCommandSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("AmbienceCommand", AmbienceCommandSchema);
