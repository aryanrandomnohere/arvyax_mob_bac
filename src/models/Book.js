import mongoose from "mongoose";

const { Schema } = mongoose;

const BookSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    author: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    year: {
      type: Number,
      default: null,
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
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    pages: {
      type: Number,
      default: 0,
    },

    isbn: {
      type: String,
      default: "",
      trim: true,
    },

    // Immersive Mode - Video experience with ambience
    immersiveMode: {
      enabled: {
        type: Boolean,
        default: false,
      },
      videoUrl: {
        type: String,
        default: "",
        trim: true,
      },
      // Ambience JSON for controlling environment/lighting/sound
      ambienceJson: {
        type: Schema.Types.Mixed,
        default: null,
      },
    },

    // Quiet Mode - Reading with optional audio
    quietMode: {
      enabled: {
        type: Boolean,
        default: false,
      },
      // PDF for reading
      pdfUrl: {
        type: String,
        default: "",
        trim: true,
      },
      // Optional audiobook for simultaneous listening
      audioUrl: {
        type: String,
        default: "",
        trim: true,
      },
      audioDuration: {
        type: Number, // in seconds
        default: 0,
      },
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

BookSchema.index({ genre: 1, isActive: 1 });
BookSchema.index({ author: 1, isActive: 1 });
BookSchema.index({ isActive: 1, order: 1 });

BookSchema.statics.getActiveBooks = function () {
  return this.find({
    $or: [{ isActive: true }, { isActive: { $exists: false } }],
  }).sort({ order: 1, createdAt: -1 });
};

BookSchema.statics.getBooksByGenre = function (
  genre,
  limit = 10,
  excludeId = null
) {
  const query = {
    $and: [
      { genre: genre },
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

BookSchema.statics.getBooksByAuthor = function (author, excludeId = null) {
  const query = {
    $and: [
      { author },
      {
        $or: [{ isActive: true }, { isActive: { $exists: false } }],
      },
    ],
  };

  if (excludeId) {
    query.$and.push({ _id: { $ne: excludeId } });
  }

  return this.find(query).sort({ order: 1, createdAt: -1 });
};

const Book = mongoose.model("Book", BookSchema);

export default Book;
