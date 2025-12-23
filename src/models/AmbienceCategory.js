import mongoose from "mongoose";

const { Schema } = mongoose;

const AmbienceThemeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: false,
  }
);

const AmbienceCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    themes: {
      type: [AmbienceThemeSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
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

AmbienceCategorySchema.statics.getCategories = function () {
  return this.find({ isActive: true }).sort({ order: 1 });
};

AmbienceCategorySchema.statics.getCategoryById = function (id) {
  return this.findById(id);
};

const AmbienceCategory = mongoose.model(
  "AmbienceCategory",
  AmbienceCategorySchema
);

export default AmbienceCategory;
