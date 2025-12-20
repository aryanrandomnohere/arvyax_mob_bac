import mongoose, { Schema, Document, Model } from "mongoose";

export type FeelingType = string;

export interface IFeelingLog extends Document {
  user: mongoose.Types.ObjectId;
  feeling: FeelingType;
  startedAt: Date;
  endedAt?: Date | null;
  dateKey: string; // YYYY-MM-DD (UTC)
  createdAt: Date;
  updatedAt: Date;
}

interface IFeelingLogModel extends Model<IFeelingLog> {
  getCurrentOpenLog(userId: string): Promise<IFeelingLog | null>;
  getLogsForRange(
    userId: string,
    from?: Date,
    to?: Date
  ): Promise<IFeelingLog[]>;
}

const FeelingLogSchema = new Schema<IFeelingLog>(
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

function toUtcDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

FeelingLogSchema.pre("validate", function (next) {
  const startedAt = this.startedAt ?? new Date();
  this.startedAt = startedAt;
  this.dateKey = this.dateKey || toUtcDateKey(startedAt);
});

FeelingLogSchema.statics.getCurrentOpenLog = function (userId: string) {
  return this.findOne({ user: userId, endedAt: null }).sort({ startedAt: -1 });
};

FeelingLogSchema.statics.getLogsForRange = function (
  userId: string,
  from?: Date,
  to?: Date
) {
  const query: any = { user: userId };

  if (from || to) {
    query.startedAt = {};
    if (from) query.startedAt.$gte = from;
    if (to) query.startedAt.$lte = to;
  }

  return this.find(query).sort({ startedAt: -1 });
};

const FeelingLog = mongoose.model<IFeelingLog, IFeelingLogModel>(
  "FeelingLog",
  FeelingLogSchema
);

export default FeelingLog;
