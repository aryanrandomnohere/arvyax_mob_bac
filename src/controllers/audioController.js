import mongoose from "mongoose";
import Audio from "../models/Audio.js";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import * as config from "../config/constants.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Audio Controller
 * Handles mindfulness/meditation/breath work audio files
 * Used for guided meditation, box breathing, sound therapy, etc.
 */

// Cloudflare R2 Configuration (AWS SDK v3)
const r2 = new S3Client({
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || config.R2_ACCESS_KEY_ID,
    secretAccessKey:
      process.env.R2_SECRET_ACCESS_KEY || config.R2_SECRET_ACCESS_KEY,
  },
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || config.R2_ENDPOINT,
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || config.R2_BUCKET_NAME;
const PUBLIC_R2_URL = process.env.R2_PUBLIC_URL || config.R2_PUBLIC_URL;

// Helper function to upload file to R2
const uploadToR2 = async (fileBuffer, fileName, mimeType, folder = "audio") => {
  const key = `${folder}/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: "public-read",
  });

  const result = await r2.send(command);
  return {
    key,
    url: `${PUBLIC_R2_URL}/${key}`,
    etag: result.ETag,
  };
};

// Helper function to delete file from R2
const deleteFromR2 = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await r2.send(command);
  return true;
};

/**
 * Get all audio files
 * Returns list of all meditation/mindfulness audio
 */
export const getAllAudios = async (req, res) => {
  try {
    const audios = await Audio.find().sort({ createdAt: -1 });
    console.log(`Retrieved ${audios.length} audio files from database`);
    res.json(audios);
  } catch (error) {
    console.error("Error fetching audios:", error);
    res.status(500).json({
      error: "Failed to fetch audio files",
      details: error.message,
    });
  }
};

/**
 * Upload audio with file
 * Stores audio and optional thumbnail in R2
 */
export const uploadAudio = async (req, res) => {
  try {
    const { title, duration } = req.body;
    const audioFile = req.files?.audioFile?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!title) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Title is required",
      });
    }

    if (!audioFile) {
      return res.status(400).json({
        error: "Missing audio file",
        details: "Audio file is required",
      });
    }

    console.log("\n=== Starting Audio Upload to R2 ===");
    console.log("Title:", title);

    const audioUpload = await uploadToR2(
      audioFile.buffer,
      `${uuidv4()}-${audioFile.originalname}`,
      audioFile.mimetype,
      "audio"
    );

    let thumbnailUpload;
    if (thumbnailFile) {
      console.log("Uploading custom thumbnail...");
      thumbnailUpload = await uploadToR2(
        thumbnailFile.buffer,
        `${uuidv4()}-${thumbnailFile.originalname}`,
        thumbnailFile.mimetype,
        "thumbnails"
      );
    } else {
      console.log("No thumbnail provided, using default...");
      const defaultThumbnailKey = "thumbnails/default-audio-thumbnail.png";
      thumbnailUpload = {
        key: defaultThumbnailKey,
        url: `${PUBLIC_R2_URL}/${defaultThumbnailKey}`,
      };
    }

    const audio = await Audio.create({
      title,
      url: audioUpload.url,
      thumbnailUrl: thumbnailUpload.url,
      r2Key: audioUpload.key,
      thumbnailR2Key: thumbnailUpload.key,
      duration: duration ? parseInt(duration) : 0,
      fileSize: audioFile.size,
      mimeType: audioFile.mimetype,
    });

    console.log("=== Audio Successfully Stored in R2 ===\n");

    res.status(201).json({
      success: true,
      audio,
    });
  } catch (error) {
    console.error("Error uploading audio:", error);
    res.status(500).json({
      error: "Failed to upload audio",
      details: error.message,
    });
  }
};

/**
 * Upload audio via URL (legacy support)
 * For direct URL-based saves
 */
export const uploadAudioUrl = async (req, res) => {
  try {
    const {
      title,
      url,
      thumbnailUrl,
      r2Key,
      thumbnailR2Key,
      duration,
      fileSize,
    } = req.body;

    if (!title || !url || !thumbnailUrl || !r2Key || !thumbnailR2Key) {
      return res.status(400).json({
        error: "Missing required fields",
        details:
          "Title, URL, thumbnailUrl, r2Key, and thumbnailR2Key are required",
      });
    }

    const audio = await Audio.create({
      title,
      url,
      thumbnailUrl,
      r2Key,
      thumbnailR2Key,
      duration: duration || 0,
      fileSize: fileSize || 0,
    });

    res.status(201).json({
      success: true,
      audio,
    });
  } catch (error) {
    console.error("Error uploading audio:", error);
    res.status(500).json({
      error: "Failed to upload audio",
      details: error.message,
    });
  }
};

/**
 * Delete audio
 * Removes audio and thumbnail from R2 and database
 */
export const deleteAudio = async (req, res) => {
  try {
    const audio = await Audio.findById(req.params.id);
    if (!audio) {
      return res.status(404).json({ error: "Audio not found" });
    }

    console.log("\n=== Starting Audio Deletion ===");
    console.log("Audio ID:", req.params.id);

    let deletionErrors = [];

    if (audio.r2Key && audio.r2Key !== "undefined" && audio.r2Key !== "null") {
      try {
        await deleteFromR2(audio.r2Key);
        console.log("✅ Audio deleted from R2 successfully");
      } catch (error) {
        console.error("❌ Audio R2 deletion failed:", error.message);
        deletionErrors.push(`Audio deletion error: ${error.message}`);
      }
    }

    if (
      audio.thumbnailR2Key &&
      audio.thumbnailR2Key !== "undefined" &&
      audio.thumbnailR2Key !== "null"
    ) {
      try {
        await deleteFromR2(audio.thumbnailR2Key);
        console.log("✅ Thumbnail deleted from R2 successfully");
      } catch (error) {
        console.error("❌ Thumbnail R2 deletion failed:", error.message);
        deletionErrors.push(`Thumbnail deletion error: ${error.message}`);
      }
    }

    await Audio.findByIdAndDelete(req.params.id);
    console.log("✅ Audio deleted from database");

    res.json({
      success: true,
      message: "Audio deleted successfully",
      warnings: deletionErrors.length > 0 ? deletionErrors : undefined,
    });
  } catch (error) {
    console.error("❌ Error deleting audio:", error);
    res.status(500).json({
      error: "Failed to delete audio",
      details: error.message,
    });
  }
};

/**
 * Force delete audio
 * Deletes from database even if R2 deletion fails
 */
export const forceDeleteAudio = async (req, res) => {
  try {
    const audio = await Audio.findById(req.params.id);
    if (!audio) {
      return res.status(404).json({ error: "Audio not found" });
    }

    console.log("\n=== Force Delete Audio ===");

    try {
      await deleteFromR2(audio.r2Key);
      await deleteFromR2(audio.thumbnailR2Key);
    } catch (error) {
      console.log("R2 deletion failed, continuing with database deletion");
    }

    await Audio.findByIdAndDelete(req.params.id);
    console.log("✅ Audio force deleted from database");

    res.json({
      success: true,
      message: "Audio force deleted successfully",
    });
  } catch (error) {
    console.error("Error force deleting audio:", error);
    res.status(500).json({
      error: "Failed to force delete audio",
      details: error.message,
    });
  }
};

/**
 * Update audio details
 * Updates title and metadata
 */
export const updateAudio = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        error: "Title is required",
      });
    }

    const audio = await Audio.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true }
    );

    if (!audio) {
      return res.status(404).json({ error: "Audio not found" });
    }

    console.log(`Audio title updated: ${audio.title}`);

    res.json({
      success: true,
      audio,
    });
  } catch (error) {
    console.error("Error updating audio:", error);
    res.status(500).json({
      error: "Failed to update audio",
      details: error.message,
    });
  }
};

/**
 * Get audio file info
 * Returns detailed audio information
 */
export const getAudioInfo = async (req, res) => {
  try {
    const audioId = (req.params.id || "").trim();
    // Guard against malformed ids so Mongoose doesn't throw a CastError
    if (!mongoose.Types.ObjectId.isValid(audioId)) {
      return res.status(400).json({
        error: "Invalid audio id format",
        details: "Expected a 24-character hex ObjectId",
      });
    }
    console.log("Fetching audio info for ID:", audioId);
    const audio = await Audio.findById(audioId);
    if (!audio) {
      return res.status(404).json({ error: "Audio not found" });
    }

    res.json({
      success: true,
      audio,
    });
  } catch (error) {
    console.error("Error fetching audio info:", error);
    res.status(500).json({
      error: "Failed to fetch audio info",
      details: error.message,
    });
  }
};

/**
 * Test R2 connection
 * Validates cloud storage connectivity
 */
export const testR2Connection = async (req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1,
    });

    const result = await r2.send(command);

    res.json({
      success: true,
      message: "R2 connection successful",
      bucketName: BUCKET_NAME,
      objectCount: result.KeyCount,
      publicUrl: PUBLIC_R2_URL,
    });
  } catch (error) {
    console.error("R2 connection test failed:", error);
    res.status(500).json({
      success: false,
      error: "R2 connection failed",
      details: error.message,
    });
  }
};
