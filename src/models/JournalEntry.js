import mongoose from "mongoose";

const { Schema } = mongoose;

const JournalTaskItemSchema = new Schema(
  {
    task: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "skipped"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const JournalQuestionsSchema = new Schema(
  {
    mistakes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },

    whatDidYouLearn: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },

    anythingSpecialHappenedToday: {
      aboutIt: {
        type: String,
        default: "",
        trim: true,
        maxlength: 5000,
      },

      photos: {
        type: [String],
        default: [],
      },
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

const JournalEntrySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "RegisterUser",
      required: true,
      index: true,
    },

    // YYYY-MM-DD in UTC
    dateKey: {
      type: String,
      required: true,
      index: true,
    },

    tasks: {
      type: [JournalTaskItemSchema],
      default: [],
    },

    questions: {
      type: JournalQuestionsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

JournalEntrySchema.index({ user: 1, dateKey: 1 }, { unique: true });
JournalEntrySchema.index({ user: 1, dateKey: -1 });

const JournalEntry = mongoose.model("JournalEntry", JournalEntrySchema);

export default JournalEntry;
