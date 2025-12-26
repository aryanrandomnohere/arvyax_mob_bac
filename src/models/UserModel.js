import mongoose from "mongoose";

const { Schema } = mongoose;

const AmbienceSelectionSchema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "AmbienceCategory",
      required: true,
    },
    themeId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const PreferencesSchema = new Schema({
  nickname: {
    type: String,
    default: "",
    trim: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other", ""],
    default: "",
  },
  dob: {
    type: Date,
    default: null,
  },
  isQnaFilled: {
    type: Boolean,
    default: false,
  },
  ambienceSelections: {
    type: [AmbienceSelectionSchema],
    default: [],
    validate: {
      validator: (arr) => !arr || arr.length <= 1,
      message: "Only one ambience selection is allowed",
    },
    set: (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.length ? [arr[0]] : [];
    },
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const RegisterUserSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required."],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Additional social provider IDs (optional, unique, sparse)
    appleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true,
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    photoUrl: {
      type: String,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },

    badges: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Badge",
        },
      ],
      default: [],
    },

    preferences: {
      type: PreferencesSchema,
      default: () => ({
        nickname: "",
        gender: "",
        dob: null,
        isQnaFilled: false,
        ambienceSelections: [],
        lastUpdated: new Date(),
      }),
    },
  },
  {
    timestamps: true,
  }
);

RegisterUserSchema.pre("save", async function () {
  const prefTouched = this.modifiedPaths().some(
    (p) => p === "preferences" || p.startsWith("preferences.")
  );

  if (prefTouched) {
    this.preferences.lastUpdated = new Date();
  }
});

RegisterUserSchema.methods.updatePreference = function (field, value) {
  this.preferences[field] = value;
  this.preferences.lastUpdated = new Date();
  return this.save();
};

RegisterUserSchema.methods.getPreferences = function () {
  return this.preferences;
};

RegisterUserSchema.methods.clearPreferences = function () {
  this.preferences = {
    nickname: "",
    gender: "",
    dob: null,
    isQnaFilled: false,
    ambienceSelections: [],
    lastUpdated: new Date(),
  };
  return this.save();
};

RegisterUserSchema.statics.findByPhoneOrEmail = function (identifier) {
  return this.findOne({
    $or: [{ phoneNumber: identifier }, { email: identifier }],
  });
};

/**
 * Get user profile with theme information included
 * Populates the selected theme details if available
 */
RegisterUserSchema.methods.getProfileWithTheme = async function () {
  const AmbienceCategory = mongoose.model("AmbienceCategory");

  let selectedTheme = null;
  const ambienceSelection = this.preferences.ambienceSelections?.[0];

  if (ambienceSelection && ambienceSelection.themeId) {
    selectedTheme = await AmbienceCategory.getThemeById(
      ambienceSelection.themeId
    );
  }

  return {
    userId: this._id,
    username: this.username,
    email: this.email,
    phoneNumber: this.phoneNumber,
    photoUrl: this.photoUrl,
    onboardingCompleted: this.onboardingCompleted,
    preferences: {
      nickname: this.preferences.nickname,
      gender: this.preferences.gender,
      dob: this.preferences.dob,
      isQnaFilled: this.preferences.isQnaFilled,
    },
    selectedTheme: selectedTheme
      ? {
          themeId: selectedTheme.id,
          themeName: selectedTheme.name,
          themeImageUrl: selectedTheme.imageUrl,
          categoryId: selectedTheme.categoryId,
          categoryName: selectedTheme.categoryName,
        }
      : null,
    badges: this.badges,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const RegisterUser = mongoose.model("RegisterUser", RegisterUserSchema);

export default RegisterUser;
