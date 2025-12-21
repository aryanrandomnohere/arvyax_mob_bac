import mongoose from "mongoose";

const { Schema } = mongoose;

const FeelingLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "RegisterUser",
      required: true,
      index: true,
    },
    feeling: {
      type: String,
      required: true,
      trim: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

function toUtcDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

FeelingLogSchema.pre("validate", function () {
  const startedAt = this.startedAt ?? new Date();
  this.startedAt = startedAt;
  this.dateKey = this.dateKey || toUtcDateKey(startedAt);
});

FeelingLogSchema.statics.getCurrentOpenLog = function (userId) {
  return this.findOne({ user: userId, endedAt: null }).sort({ startedAt: -1 });
};

FeelingLogSchema.statics.getLogsForRange = function (userId, from, to) {
  const query = { user: userId };

  if (from || to) {
    query.startedAt = {};
    if (from) query.startedAt.$gte = from;
    if (to) query.startedAt.$lte = to;
  }

  return this.find(query).sort({ startedAt: -1 });
};

const FeelingLog = mongoose.model("FeelingLog", FeelingLogSchema);

export default FeelingLog;
