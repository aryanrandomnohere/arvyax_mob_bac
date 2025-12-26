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
              "https://via.placeholder.com/500x700/2d5016/ffffff?text=Forest+Theme",
            isActive: true,
            order: 1,
          },
          {
            name: "River",
            imageUrl:
              "https://via.placeholder.com/500x700/1e3a5f/ffffff?text=River+Theme",
            isActive: true,
            order: 2,
          },
          {
            name: "Mountain",
            imageUrl:
              "https://via.placeholder.com/500x700/4a3b2a/ffffff?text=Mountain+Theme",
            isActive: true,
            order: 3,
          },
          {
            name: "Ocean Waves",
            imageUrl:
              "https://via.placeholder.com/500x700/0d47a1/ffffff?text=Ocean+Waves",
            isActive: true,
            order: 4,
          },
          {
            name: "Rainforest",
            imageUrl:
              "https://via.placeholder.com/500x700/1b5e20/ffffff?text=Rainforest",
            isActive: true,
            order: 5,
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
              "https://via.placeholder.com/500x700/6f4e37/ffffff?text=Coffee+Shop",
            isActive: true,
            order: 1,
          },
          {
            name: "Library",
            imageUrl:
              "https://via.placeholder.com/500x700/5c4033/ffffff?text=Library",
            isActive: true,
            order: 2,
          },
          {
            name: "City Rain",
            imageUrl:
              "https://via.placeholder.com/500x700/455a64/ffffff?text=City+Rain",
            isActive: true,
            order: 3,
          },
          {
            name: "Bustling Street",
            imageUrl:
              "https://via.placeholder.com/500x700/37474f/ffffff?text=Bustling+Street",
            isActive: true,
            order: 4,
          },
        ],
        isActive: true,
        order: 2,
      },
      {
        name: "Cozy",
        description: "Warm and comfortable ambient environments",
        themes: [
          {
            name: "Fireplace",
            imageUrl:
              "https://via.placeholder.com/500x700/bf360c/ffffff?text=Fireplace",
            isActive: true,
            order: 1,
          },
          {
            name: "Candlelit Room",
            imageUrl:
              "https://via.placeholder.com/500x700/f57f17/ffffff?text=Candlelit+Room",
            isActive: true,
            order: 2,
          },
          {
            name: "Rainy Night",
            imageUrl:
              "https://via.placeholder.com/500x700/263238/ffffff?text=Rainy+Night",
            isActive: true,
            order: 3,
          },
          {
            name: "Warm Cabin",
            imageUrl:
              "https://via.placeholder.com/500x700/827717/ffffff?text=Warm+Cabin",
            isActive: true,
            order: 4,
          },
        ],
        isActive: true,
        order: 3,
      },
      {
        name: "Meditation",
        description: "Peaceful and spiritual themes for deep meditation",
        themes: [
          {
            name: "Zen Garden",
            imageUrl:
              "https://via.placeholder.com/500x700/1b5e20/ffffff?text=Zen+Garden",
            isActive: true,
            order: 1,
          },
          {
            name: "Tibetan Bowls",
            imageUrl:
              "https://via.placeholder.com/500x700/d4af37/ffffff?text=Tibetan+Bowls",
            isActive: true,
            order: 2,
          },
          {
            name: "Mantra Om",
            imageUrl:
              "https://via.placeholder.com/500x700/9c27b0/ffffff?text=Mantra+Om",
            isActive: true,
            order: 3,
          },
          {
            name: "Chakra Healing",
            imageUrl:
              "https://via.placeholder.com/500x700/6a1b9a/ffffff?text=Chakra+Healing",
            isActive: true,
            order: 4,
          },
          {
            name: "Crystal Bowls",
            imageUrl:
              "https://via.placeholder.com/500x700/1a237e/ffffff?text=Crystal+Bowls",
            isActive: true,
            order: 5,
          },
        ],
        isActive: true,
        order: 4,
      },
      {
        name: "Sleep",
        description:
          "Soothing soundscapes to help you drift into peaceful sleep",
        themes: [
          {
            name: "Gentle Rain",
            imageUrl:
              "https://via.placeholder.com/500x700/4fc3f7/ffffff?text=Gentle+Rain",
            isActive: true,
            order: 1,
          },
          {
            name: "Distant Thunder",
            imageUrl:
              "https://via.placeholder.com/500x700/5c6bc0/ffffff?text=Distant+Thunder",
            isActive: true,
            order: 2,
          },
          {
            name: "Lullabies",
            imageUrl:
              "https://via.placeholder.com/500x700/ba68c8/ffffff?text=Lullabies",
            isActive: true,
            order: 3,
          },
          {
            name: "White Noise",
            imageUrl:
              "https://via.placeholder.com/500x700/bdbdbd/ffffff?text=White+Noise",
            isActive: true,
            order: 4,
          },
          {
            name: "Heartbeat",
            imageUrl:
              "https://via.placeholder.com/500x700/ef5350/ffffff?text=Heartbeat",
            isActive: true,
            order: 5,
          },
        ],
        isActive: true,
        order: 5,
      },
      {
        name: "Focus",
        description: "Ambient sounds to enhance concentration and productivity",
        themes: [
          {
            name: "Lo-fi Beats",
            imageUrl:
              "https://via.placeholder.com/500x700/ff6f00/ffffff?text=Lo-fi+Beats",
            isActive: true,
            order: 1,
          },
          {
            name: "Classical Piano",
            imageUrl:
              "https://via.placeholder.com/500x700/1565c0/ffffff?text=Classical+Piano",
            isActive: true,
            order: 2,
          },
          {
            name: "Ambient Synth",
            imageUrl:
              "https://via.placeholder.com/500x700/283593/ffffff?text=Ambient+Synth",
            isActive: true,
            order: 3,
          },
          {
            name: "Nature Focus",
            imageUrl:
              "https://via.placeholder.com/500x700/00838f/ffffff?text=Nature+Focus",
            isActive: true,
            order: 4,
          },
        ],
        isActive: true,
        order: 6,
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
      0
    );
    console.log(`📊 Total themes: ${totalThemes}`);

    await mongoose.connection.close();
  } catch (err) {
    console.error("❌ SEED ERROR:", err);
    process.exit(1);
  }
};

seedAmbienceCategories();
