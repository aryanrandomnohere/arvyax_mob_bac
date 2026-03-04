import mongoose from "mongoose";
import Breathing from "../models/Breathing.js";
import { MONGODB_URI } from "../config/constants.js";

const seedMindfulnessBreathing = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("📦 Connected to database");

    // Breathing exercises from Flutter config
    const mindfulnessBreathingExercises = [
      {
        type: "alternateNostril",
        name: "Alternate Nostril Breathing",
        description: "Quick breathing technique for mental clarity and balance",
        duration: "short",
        videos: [
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/flowers%20-%20Made%20with%20Clipchamp.mp4",
        ],
        category: "mindfulness",
        isActive: true,
        order: 1,
      },
      {
        type: "breatheInNature",
        name: "Breathe In Nature",
        description: "Peaceful breathing exercise for connecting with nature",
        duration: "short",
        videos: [
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/ocean%20-%20Made%20with%20Clipchamp.mp4",
        ],
        category: "mindfulness",
        isActive: true,
        order: 2,
      },
      {
        type: "deepChestBreathing",
        name: "Deep Chest Breathing",
        description: "Full lung capacity breathing for stress relief",
        duration: "short",
        videos: [
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/mountaim%20-%20Made%20with%20Clipchamp.mp4",
        ],
        category: "mindfulness",
        isActive: true,
        order: 3,
      },
      {
        type: "morningBreath",
        name: "Morning Breath",
        description: "Energizing breathing practice to start your day",
        duration: "long",
        videos: [
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/1266b410-9f05-45d9-b3b4-af1d100da947.mp4",
        ],
        category: "mindfulness",
        isActive: true,
        order: 4,
      },
    ];

    // Delete existing mindfulness breathing exercises
    await Breathing.deleteMany({
      type: {
        $in: [
          "alternateNostril",
          "breatheInNature",
          "deepChestBreathing",
          "morningBreath",
        ],
      },
    });
    console.log("🗑️  Cleared existing mindfulness breathing exercises");

    // Insert new mindfulness breathing exercises
    await Breathing.insertMany(mindfulnessBreathingExercises);
    console.log("✅ Mindfulness breathing exercises seeded successfully");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding mindfulness breathing exercises:", error);
    process.exit(1);
  }
};

seedMindfulnessBreathing();
