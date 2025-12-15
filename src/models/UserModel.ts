import mongoose, { Schema, Document, Model } from "mongoose";

export interface UserPreferences {
  gender: "male" | "female" | "other" | "";
  dob: Date | null;
  isQnaFilled: boolean;
  lastUpdated: Date;
}

export interface RegisterUserDocument extends Document {
  username: string;
  email?: string;
  phoneNumber?: string;
  googleId?: string;
  otp?: string;
  otpExpires?: Date;
  photoUrl?: string;
  onboardingCompleted: boolean;
  preferences: UserPreferences;

  updatePreference: (field: keyof UserPreferences, value: any) => Promise<this>;
  getPreferences: () => UserPreferences;
  clearPreferences: () => Promise<this>;
}

const PreferencesSchema = new Schema<UserPreferences>({
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

const RegisterUserSchema = new Schema<RegisterUserDocument>(
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

    // ✅ Minimal onboarding preferences
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

// 🔄 Update lastUpdated when preferences change
RegisterUserSchema.pre<RegisterUserDocument>("save", async function () {
  if (this.isModified("preferences")) {
    this.preferences.lastUpdated = new Date();
  }
});

// 🔧 Methods
RegisterUserSchema.methods.updatePreference = function (
  field: keyof UserPreferences,
  value: any
) {
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

// 🔍 Static Method
RegisterUserSchema.statics.findByPhoneOrEmail = function (identifier: string) {
  return this.findOne({
    $or: [{ phoneNumber: identifier }, { email: identifier }],
  });
};

const RegisterUser = mongoose.model<RegisterUserDocument>(
  "RegisterUser",
  RegisterUserSchema
);

export default RegisterUser;
