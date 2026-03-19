import mongoose from "mongoose";
import { MONGODB_URI } from "../config/constants.js";
import Notification from "../models/Notification.js";

const notifications = [
  {
    banner: "https://cdn.arvyax.com/banners/welcome.jpg",
    title: "Welcome to Arvyax",
    message:
      "Complete your first profile check-in to personalize your journey.",
    link: "arvyax://forms/userProfile",
    time: "2026-03-16T08:00:00.000Z",
    priority: {
      level: "HIGH",
      order: 20,
    },
    scheduled: {
      type: "one_time",
      frequency: "one_time",
      timeOfDay: "08:00",
      timezone: "Asia/Kolkata",
      isActive: true,
    },
  },
  {
    banner: "https://cdn.arvyax.com/banners/mood-check.jpg",
    title: "Weekly Mood Check",
    message: "How are you feeling today? Submit your weekly check-in.",
    link: "arvyax://forms/weeklyMoodCheck",
    time: "2026-03-16T09:00:00.000Z",
    priority: {
      level: "CRITICAL",
      order: 10,
    },
    scheduled: {
      type: "recurring",
      frequency: "weekly",
      dayOfWeek: "monday",
      timeOfDay: "09:00",
      timezone: "Asia/Kolkata",
      isActive: true,
    },
  },
  {
    banner: "https://cdn.arvyax.com/banners/breathing.jpg",
    title: "Daily Breathing Reminder",
    message: "Take 3 mindful breaths to reset your day.",
    link: "arvyax://breathing",
    time: "2026-03-16T06:30:00.000Z",
    priority: {
      level: "MEDIUM",
      order: 40,
    },
    scheduled: {
      type: "recurring",
      frequency: "daily",
      timeOfDay: "06:30",
      timezone: "Asia/Kolkata",
      isActive: true,
    },
  },
  {
    banner: "https://cdn.arvyax.com/banners/monthly-review.jpg",
    title: "Monthly Reflection",
    message: "Review your progress and set one intention for this month.",
    link: "arvyax://journal/monthly-review",
    time: "2026-03-31T12:00:00.000Z",
    priority: {
      level: "LOW",
      order: 80,
    },
    scheduled: {
      type: "recurring",
      frequency: "monthly",
      dayOfMonth: 31,
      timeOfDay: "12:00",
      timezone: "Asia/Kolkata",
      isActive: true,
    },
  },
];

const seedNotifications = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is missing. Please set your environment variables.",
      );
    }

    await mongoose.connect(MONGODB_URI);
    console.log("Connected to database");

    for (const notification of notifications) {
      await Notification.updateOne(
        {
          title: notification.title,
          time: new Date(notification.time),
        },
        {
          $set: {
            ...notification,
            time: new Date(notification.time),
          },
        },
        { upsert: true },
      );

      console.log(`Upserted notification: ${notification.title}`);
    }

    console.log("Notification seeding completed");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding notifications:", error);
    process.exit(1);
  }
};

seedNotifications();
