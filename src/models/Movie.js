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
  return this.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
};

MovieSchema.statics.getMoviesByGenre = function (genre, limit = 10, excludeId = null) {
  const query = {
    genres: genre,
    isActive: true,
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.find(query).limit(limit).sort({ order: 1, createdAt: -1 });
};

MovieSchema.statics.getSimilarMovies = async function (movieId, limit = 10) {
  const movie = await this.findById(movieId);
  if (!movie) return [];

  // Find movies that share at least one genre
  return this.find({
    _id: { $ne: movieId },
    genres: { $in: movie.genres },
    isActive: true,
  })
    .limit(limit)
    .sort({ order: 1, createdAt: -1 });
};

const Movie = mongoose.model("Movie", MovieSchema);

export default Movie;
