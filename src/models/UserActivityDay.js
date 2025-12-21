import mongoose from "mongoose";

const { Schema } = mongoose;

function toUtcDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const UserActivityDaySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "RegisterUser",
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    firstSeenAt: {
      type: Date,
      required: true,
    },
    lastSeenAt: {
      type: Date,
      required: true,
    },
    hits: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

UserActivityDaySchema.index({ user: 1, dateKey: 1 }, { unique: true });

UserActivityDaySchema.statics.markActive = function (userId, at = new Date()) {
  const dateKey = toUtcDateKey(at);
  return this.findOneAndUpdate(
    { user: userId, dateKey },
    {
      $setOnInsert: {
        user: userId,
        dateKey,
        firstSeenAt: at,
      },
      $set: {
        lastSeenAt: at,
      },
      $inc: {
        hits: 1,
      },
    },
    {
      new: true,
      upsert: true,
    }
  );
};

const UserActivityDay = mongoose.model(
  "UserActivityDay",
  UserActivityDaySchema
);

export default UserActivityDay;
