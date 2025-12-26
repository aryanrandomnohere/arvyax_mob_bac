import mongoose from "mongoose";
import Game from "../models/Game.js";
import { MONGODB_URI } from "../config/constants.js";

const seedGames = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("📦 Connected to database for Games");

    const fakeGames = [
      {
        title: "Zen Puzzle Flow",
        description:
          "A relaxing puzzle game that combines pattern matching with meditation mechanics.",
        genre: ["Puzzle", "Casual"],
        year: 2023,
        platform: ["iOS", "Android", "Web"],
        rating: "8.7",
        developer: "Mindful Studios",
        coverUrl:
          "https://via.placeholder.com/400x300/2ecc71/ffffff?text=Zen+Puzzle",
        playUrl: "https://example.com/games/zen-puzzle-flow",
        isActive: true,
        order: 1,
      },
      {
        title: "Breath Balance",
        description:
          "A breathing exercise game that teaches proper breathing techniques through interactive gameplay.",
        genre: ["Educational", "Health"],
        year: 2024,
        platform: ["iOS", "Android"],
        rating: "8.9",
        developer: "Wellness Games Inc",
        coverUrl:
          "https://via.placeholder.com/400x300/3498db/ffffff?text=Breath+Balance",
        playUrl: "https://example.com/games/breath-balance",
        isActive: true,
        order: 2,
      },
      {
        title: "Mindful Movement",
        description:
          "Combine yoga poses with game mechanics in this body-tracking fitness adventure.",
        genre: ["Fitness", "Adventure"],
        year: 2023,
        platform: ["iOS", "Android", "PC"],
        rating: "8.4",
        developer: "FitGame Studios",
        coverUrl:
          "https://via.placeholder.com/400x300/9b59b6/ffffff?text=Mindful+Movement",
        playUrl: "https://example.com/games/mindful-movement",
        isActive: true,
        order: 3,
      },
      {
        title: "Brain Harmony",
        description:
          "Exercise your brain with meditation-inspired puzzles and memory challenges.",
        genre: ["Brain Training", "Puzzle"],
        year: 2023,
        platform: ["iOS", "Android", "Web"],
        rating: "8.6",
        developer: "Neural Games",
        coverUrl:
          "https://via.placeholder.com/400x300/e74c3c/ffffff?text=Brain+Harmony",
        playUrl: "https://example.com/games/brain-harmony",
        isActive: true,
        order: 4,
      },
      {
        title: "Nature Quest",
        description:
          "Explore beautiful natural environments while solving nature-themed puzzles and unlocking achievements.",
        genre: ["Adventure", "Casual"],
        year: 2024,
        platform: ["iOS", "Android", "Web"],
        rating: "8.8",
        developer: "Green Path Games",
        coverUrl:
          "https://via.placeholder.com/400x300/27ae60/ffffff?text=Nature+Quest",
        playUrl: "https://example.com/games/nature-quest",
        isActive: true,
        order: 5,
      },
      {
        title: "Harmony Tiles",
        description:
          "A music-based puzzle game that combines sound design with strategic tile matching.",
        genre: ["Puzzle", "Music"],
        year: 2023,
        platform: ["iOS", "Android", "Web", "PC"],
        rating: "8.5",
        developer: "Audio Games Lab",
        coverUrl:
          "https://via.placeholder.com/400x300/f39c12/ffffff?text=Harmony+Tiles",
        playUrl: "https://example.com/games/harmony-tiles",
        isActive: true,
        order: 6,
      },
      {
        title: "Stretch Challenge",
        description:
          "Daily stretching challenges with real-time feedback and progress tracking.",
        genre: ["Fitness", "Health"],
        year: 2024,
        platform: ["iOS", "Android"],
        rating: "8.3",
        developer: "FlexMind Games",
        coverUrl:
          "https://via.placeholder.com/400x300/1abc9c/ffffff?text=Stretch+Challenge",
        playUrl: "https://example.com/games/stretch-challenge",
        isActive: true,
        order: 7,
      },
      {
        title: "Serenity Sound Garden",
        description:
          "Create and arrange musical elements in a beautiful garden to unlock relaxation and rewards.",
        genre: ["Casual", "Music"],
        year: 2023,
        platform: ["iOS", "Android", "Web"],
        rating: "8.9",
        developer: "Calm Creations",
        coverUrl:
          "https://via.placeholder.com/400x300/34495e/ffffff?text=Sound+Garden",
        playUrl: "https://example.com/games/serenity-sound-garden",
        isActive: true,
        order: 8,
      },
    ];

    // Clear existing games (optional - remove if you want to keep existing data)
    await Game.deleteMany({});
    console.log("🗑️  Cleared existing games");

    // Insert new games
    const result = await Game.insertMany(fakeGames);
    console.log(`✅ ${result.length} games seeded successfully`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding games:", error);
    process.exit(1);
  }
};

seedGames();
