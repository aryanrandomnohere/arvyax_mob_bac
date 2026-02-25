import mongoose from "mongoose";
import AmbienceCategory from "../models/AmbienceCategory.js";
import { MONGODB_URI } from "../config/constants.js";

const seedAmbienceCategories = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("📦 Connected to database for Ambience Categories");

    const fakeCategories = [
      {
        name: "Nature",
        description:
          "Immerse yourself in natural environments and outdoor soundscapes",
        themes: [
          {
            name: "Forest",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/Nature/nature%201.png",
            isActive: true,
            order: 1,
          },
          {
            name: "River",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/Nature/nature%204.png",
            isActive: true,
            order: 2,
          },
          {
            name: "Mountain",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/Nature/nature%202.png",
            isActive: true,
            order: 3,
          },
          {
            name: "Rainforest",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/Nature/nature%203.png",
            isActive: true,
            order: 4,
          },
        ],
        isActive: true,
        order: 1,
      },
      {
        name: "Urban",
        description: "Experience calming city and ambient sounds",
        themes: [
          {
            name: "Coffee Shop",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/Urban/Urban%201.png",
            isActive: true,
            order: 1,
          },
          {
            name: "Library",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/Urban/Urban%202.png",
            isActive: true,
            order: 2,
          },
          {
            name: "City Rain",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/Urban/Urban%203.png",
            isActive: true,
            order: 3,
          },
        ],
        isActive: true,
        order: 2,
      },
      {
        name: "Cafe",
        description: "Cafe ambience themes",
        themes: [
          {
            name: "Sunlit Minimal",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/Cafe/Cafe%201.png",
            isActive: true,
            order: 1,
          },
          {
            name: "Rainy Cozy",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/Cafe/Cafe%202.png",
            isActive: true,
            order: 2,
          },
          {
            name: "Urban Industrial",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/Cafe/Cafe%203.png",
            isActive: true,
            order: 3,
          },
          {
            name: "Night Warmth",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/Cafe/Cafe%204.png",
            isActive: true,
            order: 4,
          },
          {
            name: "Green Haven 🌿",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/Cafe/Cafe%205.png",
            isActive: true,
            order: 5,
          },
        ],
        isActive: true,
        order: 3,
      },
      {
        name: "City",
        description: "City ambience themes",
        themes: [
          {
            name: "Misty Avenue",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/City/City%201.png",
            isActive: true,
            order: 1,
          },
          {
            name: "Golden Grid",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/City/City%202.png",
            isActive: true,
            order: 2,
          },
          {
            name: "Rain Rush",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/City/City%203.png",
            isActive: true,
            order: 3,
          },
          {
            name: "Skyline Glow",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/City/City%204.png",
            isActive: true,
            order: 4,
          },
          {
            name: "Empire Dusk",
            imageUrl:
              "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience-backgrounds/City/City%205.png",
            isActive: true,
            order: 5,
          },
        ],
        isActive: true,
        order: 4,
      },
    ];

    // Clear existing categories
    await AmbienceCategory.deleteMany({});
    console.log("🗑️  Cleared existing ambience categories");

    // Insert new categories
    const result = await AmbienceCategory.insertMany(fakeCategories);
    console.log(`✅ ${result.length} ambience categories seeded successfully`);

    // Count total themes
    const totalThemes = fakeCategories.reduce(
      (sum, cat) => sum + (cat.themes?.length || 0),
      0,
    );
    console.log(`📊 Total themes: ${totalThemes}`);

    await mongoose.connection.close();
  } catch (err) {
    console.error("❌ SEED ERROR:", err);
    process.exit(1);
  }
};

seedAmbienceCategories();
