import mongoose from "mongoose";
import { MONGODB_URI } from "./constants.js";

const connectDB = async () => {
  try {
    if (!MONGODB_URI || !/^mongodb(\+srv)?:\/\//.test(MONGODB_URI)) {
      throw new Error(
        'Invalid MONGODB_URI. Expected it to start with "mongodb://" or "mongodb+srv://". Put it in .env (repo root) or src/.env.'
      );
    }
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to database.....🤘");
    console.log("MongoDB:", {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      readyState: mongoose.connection.readyState,
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

export default connectDB;
