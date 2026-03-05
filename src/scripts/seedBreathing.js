import mongoose from "mongoose";
import Breathing from "../models/Breathing.js";
import { MONGODB_URI } from "../config/constants.js";

const seedBreathing = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("📦 Connected to database");

    const breathingExercises = [
      {
        type: "triangle",
        name: "Triangle Breathing",
        description: "Equal length inhale, hold, exhale pattern for calm focus",
        videos: [
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/685c950e-0d19-4bd9-82e6-78709b2d5ed4.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/c0dc3e12-1da9-4bc8-8638-6b65b2daba92.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/5a708d58-4ebd-4ea2-8b31-dd924477d487.mp4",
        ],
        category: "mindfulness",
        order: 1,
      },
      {
        type: "line",
        name: "Line Breathing",
        description: "Rhythmic breathing pattern for steady relaxation",
        videos: [
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/4ca4a2be-029a-4211-8582-91bda71207df.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/1eb0fe63-1ac2-42fc-b364-a4eeeaed01b8.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/721a0e86-9134-4280-9618-c26ac2a6fac4.mp4",
        ],
        category: "mindfulness",
        order: 2,
      },
      {
        type: "square",
        name: "Square Breathing",
        description: "4-4-4-4 pattern breathing for deep relaxation",
        videos: [
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/5b85f10e-50a2-44af-8ad3-feb0d5c44d33.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/6820f741-fc0a-4318-842b-41531376c6b5.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/af4f225e-0edc-44b5-bc7e-139bf42b090d.mp4",
        ],
        category: "mindfulness",
        order: 3,
      },
      {
        type: "infinity",
        name: "Infinity Breathing",
        description: "Continuous flowing breath pattern for meditation",
        videos: [],
        category: "mindfulness",
        order: 4,
      },
      {
        type: "shuffle",
        name: "Shuffle Breathing",
        description: "Varied breathing patterns for dynamic practice",
        videos: [
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/6820f741-fc0a-4318-842b-41531376c6b5.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/1eb0fe63-1ac2-42fc-b364-a4eeeaed01b8.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/c0dc3e12-1da9-4bc8-8638-6b65b2daba92.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/4ca4a2be-029a-4211-8582-91bda71207df.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/af4f225e-0edc-44b5-bc7e-139bf42b090d.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/5a708d58-4ebd-4ea2-8b31-dd924477d487.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/1eb0fe63-1ac2-42fc-b364-a4eeeaed01b8.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/6820f741-fc0a-4318-842b-41531376c6b5.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/1eb0fe63-1ac2-42fc-b364-a4eeeaed01b8.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/721a0e86-9134-4280-9618-c26ac2a6fac4.mp4",
        ],
        category: "mindfulness",
        order: 5,
      },
    ];

    // Clear only box breathing exercises to avoid removing mindfulness exercise data
    await Breathing.deleteMany({
      type: { $in: ["triangle", "line", "square", "infinity", "shuffle"] },
    });
    console.log("🗑️  Cleared existing box breathing exercises");

    // Insert new breathing exercises
    await Breathing.insertMany(breathingExercises);
    console.log("✅ Breathing exercises seeded successfully");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding breathing exercises:", error);
    process.exit(1);
  }
};

seedBreathing();
