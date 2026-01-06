import mongoose from "mongoose";

const { Schema } = mongoose;

const MovieSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    year: {
      type: Number,
      required: true,
    },

    rating: {
      type: String,
      default: "",
      trim: true,
    },

    duration: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    posterUrl: {
      type: String,
      required: true,
      trim: true,
    },

    backdropUrl: {
      type: String,
      default: "",
      trim: true,
    },

    genres: {
      type: [String],
      required: true,
      index: true,
    },

    languages: {
      type: [
        {
          name: { type: String, required: true },
          isOriginal: { type: Boolean, default: false },
        },
      ],
      default: [],
    },

    watchUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // Ambience JSON for controlling environment during movie playback
    ambienceJson: {
      type: Schema.Types.Mixed,
      default: null,
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

MovieSchema.index({ genres: 1, isActive: 1 });
MovieSchema.index({ isActive: 1, order: 1 });

MovieSchema.statics.getActiveMovies = function () {
  // Return movies where isActive is true OR isActive field doesn't exist (backward compat)
  return this.find({
    $or: [{ isActive: true }, { isActive: { $exists: false } }],
  }).sort({ order: 1, createdAt: -1 });
};

MovieSchema.statics.getMoviesByGenre = function (
  genre,
  limit = 10,
  excludeId = null
) {
  const query = {
    $and: [
      {
        $or: [{ genres: genre }, { genre: genre }],
      },
      {
        $or: [{ isActive: true }, { isActive: { $exists: false } }],
      },
    ],
  };

  if (excludeId) {
    query.$and.push({ _id: { $ne: excludeId } });
  }

  return this.find(query).limit(limit).sort({ order: 1, createdAt: -1 });
};

MovieSchema.statics.getSimilarMovies = async function (movieId, limit = 10) {
  const movie = await this.findById(movieId);
  if (!movie) return [];

  // Check genres first, fall back to genre if empty
  const genres =
    movie.genres && movie.genres.length > 0 ? movie.genres : movie.genre || [];
  if (!genres.length) return [];

  return this.find({
    $and: [
      { _id: { $ne: movieId } },
      {
        $or: [{ genres: { $in: genres } }, { genre: { $in: genres } }],
      },
      {
        $or: [{ isActive: true }, { isActive: { $exists: false } }],
      },
    ],
  })
    .limit(limit)
    .sort({ order: 1, createdAt: -1 });
};

const Movie = mongoose.model("Movie", MovieSchema);

export default Movie;
