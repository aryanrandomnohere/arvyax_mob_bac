import mongoose from "mongoose";
import Book from "../models/Book.js";
import { MONGODB_URI } from "../config/constants.js";

const seedBooks = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("📦 Connected to database for Books");

    const fakeBooks = [
      {
        title: "Dover Beach",
        description:
          "A classic poem by Matthew Arnold, often published with additional selected poems.",
        author: "Matthew Arnold",
        genre: ["Poetry", "Classics"],
        year: 1867,
        rating: 0,
        pages: 0,
        isbn: "DO-ARNOLD-DOVER-BEACH",
        coverUrl:
          "https://pub-471d577e2a1645a3b80ea2e8ab0fb6b5.r2.dev/books/dover_beach/Dover%20Beach%20and%20Other%20Poems%20-%20Matthew%20Arnold.jpeg",
        readUrl:
          "https://pub-471d577e2a1645a3b80ea2e8ab0fb6b5.r2.dev/books/dover_beach/arnold-dover-beach.pdf",
        isActive: true,
        order: 1,
      },
      {
        title: "Robinson Crusoe",
        description:
          "Daniel Defoe's adventure classic about survival and resilience on a deserted island.",
        author: "Daniel Defoe",
        genre: ["Classics", "Adventure"],
        year: 1719,
        rating: 0,
        pages: 0,
        isbn: "DO-DEFOE-ROBINSON-CRUSOE",
        coverUrl:
          "https://pub-471d577e2a1645a3b80ea2e8ab0fb6b5.r2.dev/books/robinson_crusoe/Robinson.jpeg",
        readUrl:
          "https://pub-471d577e2a1645a3b80ea2e8ab0fb6b5.r2.dev/books/robinson_crusoe/ROBINSON%20CRUSOE%20BY%20DANIEL%20DEFOEW.pdf",
        isActive: true,
        order: 2,
      },
      {
        title: "The Raven",
        description:
          "Edgar Allan Poe's iconic narrative poem blending grief, mystery, and the supernatural.",
        author: "Edgar Allan Poe",
        genre: ["Poetry", "Classics"],
        year: 1845,
        rating: 0,
        pages: 0,
        isbn: "DO-POE-THE-RAVEN",
        coverUrl:
          "https://pub-471d577e2a1645a3b80ea2e8ab0fb6b5.r2.dev/books/the_raven/The%20Raven%20Book%20Cover%20-%20Elizabeth%20Underwood.jpeg",
        readUrl:
          "https://pub-471d577e2a1645a3b80ea2e8ab0fb6b5.r2.dev/books/the_raven/the-works-of-edgar-allan-poe-078-the-raven.pdf",
        isActive: true,
        order: 3,
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
