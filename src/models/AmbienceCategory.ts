import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * 1️⃣ Document Interface (what a MongoDB document looks like)
 */
export interface IAmbienceCategory extends Document {
  name: string;
  description: string;
  images: string[];
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 2️⃣ Model Interface (static methods)
 */
interface IAmbienceCategoryModel extends Model<IAmbienceCategory> {
  getCategories(): Promise<IAmbienceCategory[]>;
  getCategoryById(id: string): Promise<IAmbienceCategory | null>;
}

/**
 * 3️⃣ Schema
 */
const AmbienceCategorySchema = new Schema<IAmbienceCategory>(
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

/**
 * 4️⃣ Static Methods
 */
AmbienceCategorySchema.statics.getCategories = function () {
  return this.find({ isActive: true }).sort({ order: 1 });
};

AmbienceCategorySchema.statics.getCategoryById = function (id: string) {
  return this.findById(id);
};

/**
 * 5️⃣ Model Export
 */
const AmbienceCategory = mongoose.model<
  IAmbienceCategory,
  IAmbienceCategoryModel
>("AmbienceCategory", AmbienceCategorySchema);

export default AmbienceCategory;
