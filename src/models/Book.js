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
    //this needs to be discussed
    readUrl: {
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

BookSchema.index({ genre: 1, isActive: 1 });
BookSchema.index({ author: 1, isActive: 1 });
BookSchema.index({ isActive: 1, order: 1 });

BookSchema.statics.getActiveBooks = function () {
  return this.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
};

BookSchema.statics.getBooksByGenre = function (
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

BookSchema.statics.getBooksByAuthor = function (author, excludeId = null) {
  const query = {
    author,
    isActive: true,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.find(query).sort({ order: 1, createdAt: -1 });
};

const Book = mongoose.model("Book", BookSchema);

export default Book;
