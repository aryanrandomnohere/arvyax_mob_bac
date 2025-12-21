import mongoose from "mongoose";

const { Schema } = mongoose;

const PreferencesSchema = new Schema({
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

    preferences: {
      type: PreferencesSchema,
      default: () => ({
        gender: "",
        dob: null,
        isQnaFilled: false,
        lastUpdated: new Date(),
      }),
    },
  },
  {
    timestamps: true,
  }
);

RegisterUserSchema.pre("save", async function () {
  if (this.isModified("preferences")) {
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
    gender: "",
    dob: null,
    isQnaFilled: false,
    lastUpdated: new Date(),
  };
  return this.save();
};

RegisterUserSchema.statics.findByPhoneOrEmail = function (identifier) {
  return this.findOne({
    $or: [{ phoneNumber: identifier }, { email: identifier }],
  });
};

const RegisterUser = mongoose.model("RegisterUser", RegisterUserSchema);

export default RegisterUser;
