import mongoose from "mongoose";
import Movie from "../models/Movie.js";
import { MONGODB_URI } from "../config/constants.js";

const seedMovies = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("📦 Connected to database for Movies");

    const fakeMovies = [
      {
        title: "The Zen Garden",
        description:
          "A peaceful journey through nature and self-discovery in a traditional Japanese garden.",
        genres: ["Documentary", "Nature", "Wellness"],
        year: 2023,
        rating: "8.5",
        duration: "92 min",
        posterUrl:
          "https://via.placeholder.com/500x750/2ecc71/ffffff?text=The+Zen+Garden",
        backdropUrl:
          "https://via.placeholder.com/1280x720/2ecc71/ffffff?text=The+Zen+Garden",
        languages: [{ name: "Japanese", isOriginal: true }],
        watchUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&controls=1",
        isActive: true,
        order: 1,
      },
      {
        title: "Breathe: A Journey Within",
        description:
          "Discover the transformative power of breathing techniques and meditation.",
        genres: ["Documentary", "Health", "Wellness"],
        year: 2024,
        rating: "9.1",
        duration: "78 min",
        posterUrl:
          "https://via.placeholder.com/500x750/3498db/ffffff?text=Breathe",
        backdropUrl:
          "https://via.placeholder.com/1280x720/3498db/ffffff?text=Breathe",
        languages: [{ name: "English", isOriginal: true }],
        watchUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&controls=1",
        isActive: true,
        order: 2,
      },
      {
        title: "Mountain Serenity",
        description:
          "Experience the healing power of mountain landscapes and alpine wellness.",
        genres: ["Documentary", "Nature", "Adventure"],
        year: 2023,
        rating: "8.8",
        duration: "105 min",
        posterUrl:
          "https://via.placeholder.com/500x750/e74c3c/ffffff?text=Mountain+Serenity",
        backdropUrl:
          "https://via.placeholder.com/1280x720/e74c3c/ffffff?text=Mountain+Serenity",
        languages: [{ name: "German", isOriginal: true }],
        watchUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&controls=1",
        isActive: true,
        order: 3,
      },
      {
        title: "Ocean's Calm",
        description:
          "Relax and rejuvenate with the soothing sounds and sights of the ocean.",
        genres: ["Documentary", "Nature", "Relaxation"],
        year: 2024,
        rating: "8.3",
        duration: "87 min",
        posterUrl:
          "https://via.placeholder.com/500x750/1abc9c/ffffff?text=Ocean%27s+Calm",
        backdropUrl:
          "https://via.placeholder.com/1280x720/1abc9c/ffffff?text=Ocean%27s+Calm",
        languages: [{ name: "English", isOriginal: true }],
        watchUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&controls=1",
        isActive: true,
        order: 4,
      },
      {
        title: "Forest Therapy",
        description:
          "Explore the ancient practice of forest bathing and its scientifically proven benefits.",
        genres: ["Documentary", "Health", "Nature"],
        year: 2023,
        rating: "8.7",
        duration: "95 min",
        posterUrl:
          "https://via.placeholder.com/500x750/27ae60/ffffff?text=Forest+Therapy",
        backdropUrl:
          "https://via.placeholder.com/1280x720/27ae60/ffffff?text=Forest+Therapy",
        languages: [{ name: "French", isOriginal: true }],
        watchUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&controls=1",
        isActive: true,
        order: 5,
      },
      {
        title: "Inner Peace: The Art of Yoga",
        description:
          "A comprehensive guide to yoga practices for physical and mental wellness.",
        genres: ["Educational", "Wellness", "Fitness"],
        year: 2024,
        rating: "9.0",
        duration: "120 min",
        posterUrl:
          "https://via.placeholder.com/500x750/9b59b6/ffffff?text=Inner+Peace",
        backdropUrl:
          "https://via.placeholder.com/1280x720/9b59b6/ffffff?text=Inner+Peace",
        languages: [{ name: "Hindi", isOriginal: true }],
        watchUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&controls=1",
        isActive: true,
        order: 6,
      },
      {
        title: "Desert Harmony",
        description:
          "Find balance and tranquility in the vast landscapes of the Sahara Desert.",
        genres: ["Documentary", "Travel", "Wellness"],
        year: 2023,
        rating: "8.2",
        duration: "110 min",
        posterUrl:
          "https://via.placeholder.com/500x750/f39c12/ffffff?text=Desert+Harmony",
        backdropUrl:
          "https://via.placeholder.com/1280x720/f39c12/ffffff?text=Desert+Harmony",
        languages: [{ name: "Arabic", isOriginal: true }],
        watchUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&controls=1",
        isActive: true,
        order: 7,
      },
      {
        title: "Meditation Mastery",
        description:
          "Master the ancient art of meditation with modern scientific backing.",
        genres: ["Educational", "Wellness", "Health"],
        year: 2024,
        rating: "8.9",
        duration: "98 min",
        posterUrl:
          "https://via.placeholder.com/500x750/34495e/ffffff?text=Meditation",
        backdropUrl:
          "https://via.placeholder.com/1280x720/34495e/ffffff?text=Meditation",
        languages: [{ name: "English", isOriginal: true }],
        watchUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&controls=1",
        isActive: true,
        order: 8,
      },
      {
        title: "Garden Paths: A Documentary",
        description:
          "Explore the beauty and tranquility of gardens around the world.",
        genres: ["Documentary", "Nature"],
        year: 2023,
        rating: "8.4",
        duration: "88 min",
        posterUrl:
          "https://via.placeholder.com/500x750/16a085/ffffff?text=Garden+Paths",
        backdropUrl:
          "https://via.placeholder.com/1280x720/16a085/ffffff?text=Garden+Paths",
        languages: [{ name: "English", isOriginal: true }],
        watchUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&controls=1",
        isActive: true,
        order: 9,
      },
      {
        title: "Nature's Healing Touch",
        description: "Discover how nature can heal the mind, body, and spirit.",
        genres: ["Documentary", "Wellness", "Nature"],
        year: 2024,
        rating: "8.6",
        duration: "102 min",
        posterUrl:
          "https://via.placeholder.com/500x750/229954/ffffff?text=Nature+Healing",
        backdropUrl:
          "https://via.placeholder.com/1280x720/229954/ffffff?text=Nature+Healing",
        languages: [{ name: "English", isOriginal: true }],
        watchUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&controls=1",
        isActive: true,
        order: 10,
      },
      {
        title: "Zen Mind, Simple Life",
        description: "A journey into zen philosophy and minimalist living.",
        genres: ["Documentary", "Wellness"],
        year: 2023,
        rating: "8.5",
        duration: "96 min",
        posterUrl:
          "https://via.placeholder.com/500x750/1a5276/ffffff?text=Zen+Mind",
        backdropUrl:
          "https://via.placeholder.com/1280x720/1a5276/ffffff?text=Zen+Mind",
        languages: [{ name: "Japanese", isOriginal: true }],
        watchUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&controls=1",
        isActive: true,
        order: 11,
      },
      {
        title: "Wild Nature: Earth's Wonders",
        description:
          "Explore the most breathtaking natural wonders of our planet.",
        genres: ["Documentary", "Nature", "Adventure"],
        year: 2024,
        rating: "8.7",
        duration: "115 min",
        posterUrl:
          "https://via.placeholder.com/500x750/0b5345/ffffff?text=Wild+Nature",
        backdropUrl:
          "https://via.placeholder.com/1280x720/0b5345/ffffff?text=Wild+Nature",
        languages: [{ name: "English", isOriginal: true }],
        watchUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&controls=1",
        isActive: true,
        order: 12,
      },
    ];

    // Clear existing movies (optional - remove if you want to keep existing data)
    await Movie.deleteMany({});
    console.log("🗑️  Cleared existing movies");

    // Insert new movies
    const result = await Movie.insertMany(fakeMovies);
    console.log(`✅ ${result.length} movies seeded successfully`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding movies:", error);
    process.exit(1);
  }
};

seedMovies();
