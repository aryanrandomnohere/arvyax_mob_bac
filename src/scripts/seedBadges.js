import mongoose from "mongoose";
import Badge from "../models/Badge.js";
import { MONGODB_URI } from "../config/constants.js";

const seedBadges = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("📦 Connected to database");

    const streakBadges = [
      {
        name: "5-Day Streak",
        imageUrl: "/uploads/badges/streak-5.png",
        description: "Consistency Starter",
        criteria: "Maintain a 5-day streak",
        milestoneDays: 5,
        level: 1,
        order: 1,
      },
      {
        name: "10-Day Streak",
        imageUrl: "/uploads/badges/streak-10.png",
        description: "Building the Habit",
        criteria: "Maintain a 10-day streak",
        milestoneDays: 10,
        level: 2,
        order: 2,
      },
      {
        name: "30-Day Streak",
        imageUrl: "/uploads/badges/streak-30.png",
        description: "Yoga Enthusiast",
        criteria: "Maintain a 30-day streak",
        milestoneDays: 30,
        level: 3,
        order: 3,
      },
      {
        name: "50-Day Streak",
        imageUrl: "/uploads/badges/streak-50.png",
        description: "Mindful Master",
        criteria: "Maintain a 50-day streak",
        milestoneDays: 50,
        level: 4,
        order: 4,
      },
      {
        name: "100-Day Streak",
        imageUrl: "/uploads/badges/streak-100.png",
        description: "Streak Legend",
        criteria: "Maintain a 100-day streak",
        milestoneDays: 100,
        level: 5,
        order: 5,
      },
    ];

    // Clear existing badges (optional - remove this if you want to keep existing badges)
    await Badge.deleteMany({});
    console.log("🗑️  Cleared existing badges");

    // Insert new badges
    await Badge.insertMany(streakBadges);
    console.log("✅ Streak badges seeded successfully");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding badges:", error);
    process.exit(1);
  }
};

seedBadges();
