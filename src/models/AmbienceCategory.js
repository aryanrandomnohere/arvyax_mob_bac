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

/**
 * Get theme by ID with full details including category info
 * Returns: { id, name, imageUrl, categoryId, categoryName }
 */
AmbienceCategorySchema.statics.getThemeById = async function (themeId) {
  const category = await this.findOne({ "themes._id": themeId });

  if (!category || category.isActive === false) {
    return null;
  }

  const theme = category.themes.id(themeId);
  if (!theme || theme.isActive === false) {
    return null;
  }

  return {
    id: theme._id,
    name: theme.name,
    imageUrl: theme.imageUrl,
    categoryId: category._id,
    categoryName: category.name,
  };
};

/**
 * Get all themes across all active categories
 * Returns: Array of { id, name, imageUrl, categoryId, categoryName }
 */
AmbienceCategorySchema.statics.getAllThemes = async function () {
  const categories = await this.find({ isActive: true });
  const themes = [];

  for (const category of categories) {
    for (const theme of category.themes ?? []) {
      if (theme.isActive === false) continue;
      themes.push({
        id: theme._id,
        name: theme.name,
        imageUrl: theme.imageUrl,
        categoryId: category._id,
        categoryName: category.name,
      });
    }
  }

  return themes;
};

const AmbienceCategory = mongoose.model(
  "AmbienceCategory",
  AmbienceCategorySchema
);

export default AmbienceCategory;
