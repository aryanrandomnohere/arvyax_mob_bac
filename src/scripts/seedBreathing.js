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
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/triangle%201.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/triangle%202.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/triangle%203.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/triangle%204.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/triangle%205.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/triangle%206.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/triangle%207.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/triangle%208.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/triangle%209.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/triangle%2010.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/triangle%2011.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/triangle%2012.mp4",
        ],
        category: "mindfulness",
        isActive: true,
        order: 1,
      },
      {
        type: "circle",
        name: "Circle Breathing",
        description: "Smooth continuous breathing for deep relaxation",
        videos: [
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/circle%201.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/circle%202.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/circle%203.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/circle%204.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/circle%205.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/circle%206.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/circle%207.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/circle%208.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/circle%209.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/circle%2010.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/circle%2011.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/circle%2012.mp4",
        ],
        category: "mindfulness",
        isActive: true,
        order: 2,
      },
      {
        type: "line",
        name: "Line Breathing",
        description: "Rhythmic breathing pattern for steady relaxation",
        videos: [
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/line%201.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/line%202.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/line%203.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/line%204.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/line%205.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/line%206.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/line%207.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/line%208.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/line%209.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/line%2010.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/line%2011.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/line%2012.mp4",
        ],
        category: "mindfulness",
        isActive: true,
        order: 3,
      },
      {
        type: "square",
        name: "Square Breathing",
        description: "4-4-4-4 pattern breathing for deep relaxation",
        videos: [
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/square%201.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/square%202.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/square%203.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/square%204.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/square%205.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/square%206.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/square%207.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/square%208.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/square%209.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/square%2010.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/square%2011.mp4",
          "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/square%2012.mp4",
        ],
        category: "mindfulness",
        isActive: true,
        order: 4,
      },
    ];

    // Collect all videos from triangle, circle, line, square
    const allVideos = [];
    breathingExercises.forEach((exercise) => {
      allVideos.push(...exercise.videos);
    });

    // Shuffle the videos array
    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };
    const shuffledVideos = shuffleArray([...allVideos]);

    // Add shuffle breathing with shuffled videos
    breathingExercises.push({
      type: "shuffle",
      name: "Shuffle Breathing",
      description: "Varied breathing patterns for dynamic practice",
      videos: shuffledVideos,
      category: "mindfulness",
      isActive: true,
      order: 5,
    });

    // Clear only box breathing exercises to avoid removing mindfulness exercise data
    await Breathing.deleteMany({
      type: {
        $in: ["triangle", "line", "square", "infinity", "shuffle", "circle"],
      },
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
