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
        pages: 211,
        isbn: "DO-ARNOLD-DOVER-BEACH",
        coverUrl:
          "https://pub-471d577e2a1645a3b80ea2e8ab0fb6b5.r2.dev/books/dover_beach/Dover%20Beach%20and%20Other%20Poems%20-%20Matthew%20Arnold.jpeg",
        immersiveMode: {
          enabled: true,
          videoUrl:
            "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/hls/4b6d4f16-a0ee-4788-a349-b091cced90d8/playlist.m3u8",
          ambienceJson: null,
        },
        quietMode: {
          enabled: true,
          pdfUrl:
            "https://pub-471d577e2a1645a3b80ea2e8ab0fb6b5.r2.dev/books/dover_beach/arnold-dover-beach.pdf",
          audioUrl:
            "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience_pose_audios/1769333974734-ambience-9083c336-4c50-49d0-87e1-b4b610cc398c-doverbeachaudio.mp3",
          audioDuration: 1058,
        },
        isActive: true,
        order: 1,
      },
      //Numberofwords
      {
        title: "Robinson Crusoe",
        description:
          "Daniel Defoe's adventure classic about survival and resilience on a deserted island.",
        author: "Daniel Defoe",
        genre: ["Classics", "Adventure"],
        year: 1719,
        rating: 0,
        pages: 89000,
        isbn: "DO-DEFOE-ROBINSON-CRUSOE",
        coverUrl:
          "https://pub-471d577e2a1645a3b80ea2e8ab0fb6b5.r2.dev/books/robinson_crusoe/Robinson.peg",
        immersiveMode: {
          enabled: true,
          videoUrl:
            "https://pub-471d577e2a1645a3b80ea2e8ab0fb6b5.r2.dev/books/robinson_crusoe/robinson%20-%20Made%20with%20Clipchamp.mp4",
          ambienceJson: null,
        },
        quietMode: {
          enabled: true,
          pdfUrl:
            "https://pub-471d577e2a1645a3b80ea2e8ab0fb6b5.r2.dev/books/robinson_crusoe/ROBINSON%20CRUSOE%20BY%20DANIEL%20DEFOEW.pdf",
          audioUrl:
            "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience_pose_audios/1769334003159-ambience-45a1726c-c820-4d17-8699-28753037e128-robinsoncursoeaudio.mp3",
          audioDuration: 2460,
        },
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
        pages: 1152,
        isbn: "DO-POE-THE-RAVEN",
        coverUrl:
          "https://pub-471d577e2a1645a3b80ea2e8ab0fb6b5.r2.dev/books/the_raven/The%20Raven%20Book%20Cover%20-%20Elizabeth%20Underwood.jpeg",
        immersiveMode: {
          enabled: true,
          videoUrl:
            "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/hls/eb53251e-10d1-4381-8e1c-9807a8e365b5/playlist.m3u8",
          ambienceJson: null,
        },
        quietMode: {
          enabled: true,
          pdfUrl:
            "https://pub-471d577e2a1645a3b80ea2e8ab0fb6b5.r2.dev/books/the_raven/the-works-of-edgar-allan-poe-078-the-raven.pdf",
          audioUrl:
            "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience_pose_audios/1769333984073-ambience-cf93398e-0b1f-42f3-8c4e-2a40684eff2c-theravenaudio.mp3",
          audioDuration: 5161,
        },
        isActive: true,
        order: 3,
      },
      //
      {
        title: "The Jungle Book",
        description:
          "Rudyard Kipling's classic collection of stories featuring Mowgli and the animals of the jungle.",
        author: "Rudyard Kipling",
        genre: ["Classics", "Adventure", "Children"],
        year: 1894,
        rating: 0,
        pages: 19200,
        isbn: "KIPLING-THE-JUNGLE-BOOK",
        coverUrl:
          "https://pub-471d577e2a1645a3b80ea2e8ab0fb6b5.r2.dev/books/jungle_book/The%20Jungle%20Book%20(Collector's%20Edition)%20(Laminated%20Hardback%20with%20Jacket).jpeg",
        immersiveMode: {
          enabled: true,
          videoUrl:
            "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/videos/hls/8c9cdf33-ab1c-43bc-a8ca-8a21835995df/playlist.m3u8",
          ambienceJson: null,
        },
        quietMode: {
          enabled: true,
          pdfUrl:
            "https://pub-471d577e2a1645a3b80ea2e8ab0fb6b5.r2.dev/books/jungle_book/The_Jungle_Book-Rudyard_Kipling.pdf",
          audioUrl:
            "https://pub-9056ebf0d12e4e538cb2af4f4d495706.r2.dev/ambience_pose_audios/1769333951443-ambience-ff328ec6-a5b8-4961-a265-20969c30e3ea-mowgliaudio.mp3",
          audioDuration: 640,
        },
        isActive: true,
        order: 4,
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
