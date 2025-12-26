import mongoose from "mongoose";
import Book from "../models/Book.js";
import { MONGODB_URI } from "../config/constants.js";

const seedBooks = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("📦 Connected to database for Books");

    const fakeBooks = [
      {
        title: "The Yoga Bible",
        description:
          "A comprehensive guide to yoga poses, breathing techniques, and meditation practices for all levels.",
        author: "Christophe Andres",
        genre: ["Health", "Wellness", "Fitness"],
        year: 2018,
        rating: 4.3,
        pages: 396,
        isbn: "978-0241309216",
        coverUrl:
          "https://via.placeholder.com/300x450/2ecc71/ffffff?text=Yoga+Bible",
        readUrl: "https://example.com/books/yoga-bible.pdf",
        isActive: true,
        order: 1,
      },
      {
        title: "Mindfulness: A Practical Guide",
        description:
          "Learn how to cultivate mindfulness in your daily life for improved mental health and emotional resilience.",
        author: "Jon Kabat-Zinn",
        genre: ["Self-Help", "Wellness", "Psychology"],
        year: 2013,
        rating: 4.5,
        pages: 467,
        isbn: "978-0553803945",
        coverUrl:
          "https://via.placeholder.com/300x450/3498db/ffffff?text=Mindfulness",
        readUrl: "https://example.com/books/mindfulness-guide.pdf",
        isActive: true,
        order: 2,
      },
      {
        title: "The Meditation Handbook",
        description:
          "Discover various meditation techniques and their transformative effects on your well-being.",
        author: "Bhante Gunaratana",
        genre: ["Spirituality", "Wellness", "Self-Help"],
        year: 2002,
        rating: 4.4,
        pages: 256,
        isbn: "978-0861711529",
        coverUrl:
          "https://via.placeholder.com/300x450/9b59b6/ffffff?text=Meditation",
        readUrl: "https://example.com/books/meditation-handbook.pdf",
        isActive: true,
        order: 3,
      },
      {
        title: "Breathing for Wellness",
        description:
          "Explore the science of breathing and how it can transform your physical and mental health.",
        author: "James Nestor",
        genre: ["Health", "Science", "Wellness"],
        year: 2020,
        rating: 4.35,
        pages: 480,
        isbn: "978-0393517346",
        coverUrl:
          "https://via.placeholder.com/300x450/e74c3c/ffffff?text=Breathing",
        readUrl: "https://example.com/books/breathing-wellness.pdf",
        isActive: true,
        order: 4,
      },
      {
        title: "The Nature Cure",
        description:
          "Discover the healing power of nature and how to incorporate it into your wellness routine.",
        author: "Rene Spey",
        genre: ["Health", "Nature", "Alternative Medicine"],
        year: 2017,
        rating: 4.1,
        pages: 384,
        isbn: "978-0241277508",
        coverUrl:
          "https://via.placeholder.com/300x450/27ae60/ffffff?text=Nature+Cure",
        readUrl: "https://example.com/books/nature-cure.pdf",
        isActive: true,
        order: 5,
      },
      {
        title: "Zen and the Art of Living",
        description:
          "Apply Zen philosophy to modern life for greater peace, clarity, and purpose.",
        author: "Thich Nhat Hanh",
        genre: ["Spirituality", "Philosophy", "Self-Help"],
        year: 2008,
        rating: 4.25,
        pages: 320,
        isbn: "978-1888375039",
        coverUrl:
          "https://via.placeholder.com/300x450/f39c12/ffffff?text=Zen+Living",
        readUrl: "https://example.com/books/zen-living.pdf",
        isActive: true,
        order: 6,
      },
      {
        title: "The Pilates Method",
        description:
          "Master the Pilates techniques for core strength, flexibility, and body awareness.",
        author: "Brooke Siler",
        genre: ["Fitness", "Health", "Wellness"],
        year: 2019,
        rating: 4.15,
        pages: 256,
        isbn: "978-0553386998",
        coverUrl:
          "https://via.placeholder.com/300x450/1abc9c/ffffff?text=Pilates",
        readUrl: "https://example.com/books/pilates-method.pdf",
        isActive: true,
        order: 7,
      },
      {
        title: "Sound Healing: Ancient and Modern",
        description:
          "Explore the therapeutic benefits of sound and vibrations for healing and wellness.",
        author: "Liz Simpson",
        genre: ["Alternative Medicine", "Health", "Wellness"],
        year: 2015,
        rating: 4.2,
        pages: 304,
        isbn: "978-1844095353",
        coverUrl:
          "https://via.placeholder.com/300x450/16a085/ffffff?text=Sound+Healing",
        readUrl: "https://example.com/books/sound-healing.pdf",
        isActive: true,
        order: 8,
      },
    ];

    // Clear existing books (optional - remove if you want to keep existing data)
    await Book.deleteMany({});
    console.log("🗑️  Cleared existing books");

    // Insert new books
    const result = await Book.insertMany(fakeBooks);
    console.log(`✅ ${result.length} books seeded successfully`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding books:", error);
    process.exit(1);
  }
};

seedBooks();
