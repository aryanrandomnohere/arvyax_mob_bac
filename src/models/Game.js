import mongoose from "mongoose";

const { Schema } = mongoose;

const GameSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    year: {
      type: Number,
      default: null,
    },

    platform: {
      type: [String],
      default: [],
    },

    genre: {
      type: [String],
      required: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    coverUrl: {
      type: String,
      required: true,
      trim: true,
    },

    rating: {
      type: String,
      default: "",
      trim: true,
    },

    developer: {
      type: String,
      default: "",
      trim: true,
    },

    playUrl: {
      type: String,
      default: "",
      trim: true,
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
  },
  {
    timestamps: true,
  }
);

GameSchema.index({ genre: 1, isActive: 1 });
GameSchema.index({ isActive: 1, order: 1 });

GameSchema.statics.getActiveGames = function () {
  return this.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
};

GameSchema.statics.getGamesByGenre = function (
  genre,
  limit = 10,
  excludeId = null
) {
  const query = {
    genre: genre,
    isActive: true,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.find(query).limit(limit).sort({ order: 1, createdAt: -1 });
};

const Game = mongoose.model("Game", GameSchema);

export default Game;
