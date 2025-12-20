import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserActivityDay extends Document {
  user: mongoose.Types.ObjectId;
  dateKey: string; // YYYY-MM-DD (UTC)
  firstSeenAt: Date;
  lastSeenAt: Date;
  hits: number;
  createdAt: Date;
  updatedAt: Date;
}

interface IUserActivityDayModel extends Model<IUserActivityDay> {
  markActive(userId: string, at?: Date): Promise<IUserActivityDay>;
}

function toUtcDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const UserActivityDaySchema = new Schema<IUserActivityDay>(
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

UserActivityDaySchema.statics.markActive = function (
  userId: string,
  at: Date = new Date()
) {
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

const UserActivityDay = mongoose.model<IUserActivityDay, IUserActivityDayModel>(
  "UserActivityDay",
  UserActivityDaySchema
);

export default UserActivityDay;
