import mongoose from "mongoose";

const { Schema } = mongoose;

const PrioritySchema = new Schema(
  {
    level: {
      type: String,
      enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
      index: true,
    },
    order: {
      type: Number,
      default: 100,
      min: 0,
      index: true,
    },
  },
  { _id: false },
);

const ScheduledSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["one_time", "recurring"],
      default: "one_time",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "one_time"],
      default: "one_time",
    },
    dayOfWeek: {
      type: String,
      enum: [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
      default: null,
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      default: null,
    },
    timeOfDay: {
      type: String,
      default: "09:00",
      trim: true,
    },
    timezone: {
      type: String,
      default: "UTC",
      trim: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { _id: false },
);

const NotificationSchema = new Schema(
  {
    banner: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
    time: {
      type: Date,
      required: true,
      index: true,
    },
    priority: {
      type: PrioritySchema,
      default: () => ({}),
    },
    scheduled: {
      type: ScheduledSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
