import mongoose from "mongoose";
import { MONGODB_URI } from "./constants.js";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to database.....🤘");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if DB connection fails
  }
};

export default connectDB;
