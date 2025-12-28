import mongoose from "mongoose";

const { Schema } = mongoose;

const JournalTaskSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "RegisterUser",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // The day this task was originally created for.
    // Pending tasks are shown on later days as well (carry-forward).
    dueDateKey: {
      type: String,
      required: true,
      index: true,
    },

    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // Stored for easy querying of tasks completed on a specific day.
    completedDateKey: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

JournalTaskSchema.index({ user: 1, dueDateKey: 1, isCompleted: 1 });

const JournalTask = mongoose.model("JournalTask", JournalTaskSchema);

export default JournalTask;
