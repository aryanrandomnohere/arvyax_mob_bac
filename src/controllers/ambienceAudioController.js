import AmbienceAudio from "../models/AmbienceAudio.js";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import * as config from "../config/constants.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Ambience Audio Controller
 * Handles soundscape/ambience audio for "Sound escape" feature
 * Includes categories and tags (rain, forest, campfire, etc.)
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
const uploadToR2 = async (
  fileBuffer,
  fileName,
  mimeType,
  folder = "ambience_pose_audios"
) => {
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
 * Get all ambience audio files
 * Supports filtering by category and tags, with pagination
 */
export const getAllAmbienceAudios = async (req, res) => {
  try {
    const { category, tags, limit = 50, page = 1 } = req.query;

    let query = {};
    if (category) query.category = category;
    if (tags) query.tags = { $in: tags.split(",") };

    const skip = (page - 1) * limit;

    const [audios, totalCount] = await Promise.all([
      AmbienceAudio.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      AmbienceAudio.countDocuments(query),
    ]);

    console.log(
      `Retrieved ${audios.length} ambience audio files from database`
    );

    res.json({
      success: true,
      audios,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + audios.length < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching ambience audios:", error);
    res.status(500).json({
      error: "Failed to fetch ambience audio files",
      details: error.message,
    });
  }
};

/**
 * Upload ambience audio with file
 * Stores soundscape audio in R2
 */
export const uploadAmbienceAudio = async (req, res) => {
  try {
    const { title, duration, category, tags } = req.body;
    const audioFile = req.file;

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

    console.log("\n=== Starting Ambience Audio Upload to R2 ===");
    console.log("Title:", title);
    console.log("Category:", category || "ambience");

    const audioUpload = await uploadToR2(
      audioFile.buffer,
      `ambience-${uuidv4()}-${audioFile.originalname}`,
      audioFile.mimetype,
      "ambience_pose_audios"
    );

    const parsedTags = tags ? tags.split(",").map((tag) => tag.trim()) : [];

    const ambienceAudio = await AmbienceAudio.create({
      title,
      url: audioUpload.url,
      r2Key: audioUpload.key,
      duration: duration ? parseInt(duration) : 0,
      fileSize: audioFile.size,
      mimeType: audioFile.mimetype,
      category: category || "ambience",
      tags: parsedTags,
    });

    console.log("=== Ambience Audio Successfully Stored in R2 ===\n");

    res.status(201).json({
      success: true,
      audio: ambienceAudio,
    });
  } catch (error) {
    console.error("Error uploading ambience audio:", error);
    res.status(500).json({
      error: "Failed to upload ambience audio",
      details: error.message,
    });
  }
};

/**
 * Upload ambience audio via URL (legacy support)
 * For direct URL-based saves
 */
export const uploadAmbienceAudioUrl = async (req, res) => {
  try {
    const { title, url, r2Key, duration, fileSize, category, tags } = req.body;

    if (!title || !url || !r2Key) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Title, URL, and r2Key are required",
      });
    }

    const parsedTags = tags
      ? Array.isArray(tags)
        ? tags
        : tags.split(",").map((tag) => tag.trim())
      : [];

    const ambienceAudio = await AmbienceAudio.create({
      title,
      url,
      r2Key,
      duration: duration || 0,
      fileSize: fileSize || 0,
      category: category || "ambience",
      tags: parsedTags,
    });

    res.status(201).json({
      success: true,
      audio: ambienceAudio,
    });
  } catch (error) {
    console.error("Error uploading ambience audio:", error);
    res.status(500).json({
      error: "Failed to upload ambience audio",
      details: error.message,
    });
  }
};

/**
 * Delete ambience audio
 * Removes audio from R2 and database
 */
export const deleteAmbienceAudio = async (req, res) => {
  try {
    const audio = await AmbienceAudio.findById(req.params.id);
    if (!audio) {
      return res.status(404).json({ error: "Ambience audio not found" });
    }

    console.log("\n=== Starting Ambience Audio Deletion ===");
    console.log("Audio ID:", req.params.id);

    let deletionErrors = [];

    if (audio.r2Key && audio.r2Key !== "undefined" && audio.r2Key !== "null") {
      try {
        await deleteFromR2(audio.r2Key);
        console.log("✅ Ambience audio deleted from R2 successfully");
      } catch (error) {
        console.error("❌ Audio R2 deletion failed:", error.message);
        deletionErrors.push(`Audio deletion error: ${error.message}`);
      }
    }

    await AmbienceAudio.findByIdAndDelete(req.params.id);
    console.log("✅ Ambience audio deleted from database");

    res.json({
      success: true,
      message: "Ambience audio deleted successfully",
      warnings: deletionErrors.length > 0 ? deletionErrors : undefined,
    });
  } catch (error) {
    console.error("❌ Error deleting ambience audio:", error);
    res.status(500).json({
      error: "Failed to delete ambience audio",
      details: error.message,
    });
  }
};

/**
 * Force delete ambience audio
 * Deletes from database even if R2 deletion fails
 */
export const forceDeleteAmbienceAudio = async (req, res) => {
  try {
    const audio = await AmbienceAudio.findById(req.params.id);
    if (!audio) {
      return res.status(404).json({ error: "Ambience audio not found" });
    }

    console.log("\n=== Force Delete Ambience Audio ===");

    try {
      await deleteFromR2(audio.r2Key);
    } catch (error) {
      console.log("R2 deletion failed, continuing with database deletion");
    }

    await AmbienceAudio.findByIdAndDelete(req.params.id);
    console.log("✅ Ambience audio force deleted from database");

    res.json({
      success: true,
      message: "Ambience audio force deleted successfully",
    });
  } catch (error) {
    console.error("Error force deleting ambience audio:", error);
    res.status(500).json({
      error: "Failed to force delete ambience audio",
      details: error.message,
    });
  }
};

/**
 * Update ambience audio details
 * Updates title, category, and tags
 */
export const updateAmbienceAudio = async (req, res) => {
  try {
    const { title, category, tags } = req.body;

    if (!title) {
      return res.status(400).json({
        error: "Title is required",
      });
    }

    const updateData = { title };
    if (category) updateData.category = category;
    if (tags)
      updateData.tags = Array.isArray(tags)
        ? tags
        : tags.split(",").map((tag) => tag.trim());

    const audio = await AmbienceAudio.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!audio) {
      return res.status(404).json({ error: "Ambience audio not found" });
    }

    console.log(`Ambience audio updated: ${audio.title}`);

    res.json({
      success: true,
      audio,
    });
  } catch (error) {
    console.error("Error updating ambience audio:", error);
    res.status(500).json({
      error: "Failed to update ambience audio",
      details: error.message,
    });
  }
};

/**
 * Get ambience audio file info
 * Returns detailed audio information
 */
export const getAmbienceAudioInfo = async (req, res) => {
  try {
    const audio = await AmbienceAudio.findById(req.params.id);
    if (!audio) {
      return res.status(404).json({ error: "Ambience audio not found" });
    }

    res.json({
      success: true,
      audio,
    });
  } catch (error) {
    console.error("Error fetching ambience audio info:", error);
    res.status(500).json({
      error: "Failed to fetch ambience audio info",
      details: error.message,
    });
  }
};

/**
 * Get ambience audio categories
 * Returns list of all available categories
 */
export const getAmbienceCategories = async (req, res) => {
  try {
    const categories = await AmbienceAudio.distinct("category");
    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error fetching ambience categories:", error);
    res.status(500).json({
      error: "Failed to fetch categories",
      details: error.message,
    });
  }
};

/**
 * Get ambience audio tags
 * Returns list of all available tags
 */
export const getAmbienceTags = async (req, res) => {
  try {
    const tags = await AmbienceAudio.distinct("tags");
    res.json({
      success: true,
      tags,
    });
  } catch (error) {
    console.error("Error fetching ambience tags:", error);
    res.status(500).json({
      error: "Failed to fetch tags",
      details: error.message,
    });
  }
};

/**
 * Test R2 connection
 * Validates cloud storage connectivity for ambience audio
 */
export const testR2Connection = async (req, res) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: "ambience_pose_audios/",
      MaxKeys: 5,
    };

    const result = await r2.listObjectsV2(params).promise();

    res.json({
      success: true,
      message: "R2 connection successful",
      bucketName: BUCKET_NAME,
      ambienceAudioCount: result.KeyCount,
      publicUrl: PUBLIC_R2_URL,
      sampleFiles: result.Contents?.map((obj) => obj.Key) || [],
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

/**
 * Get storage statistics
 * Returns total count and size information
 */
export const getStorageStats = async (req, res) => {
  try {
    const [totalAudios, totalSize] = await Promise.all([
      AmbienceAudio.countDocuments(),
      AmbienceAudio.aggregate([
        { $group: { _id: null, totalSize: { $sum: "$fileSize" } } },
      ]),
    ]);

    const stats = {
      totalAudios,
      totalSize: totalSize[0]?.totalSize || 0,
      averageSize:
        totalAudios > 0
          ? Math.round((totalSize[0]?.totalSize || 0) / totalAudios)
          : 0,
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching storage stats:", error);
    res.status(500).json({
      error: "Failed to fetch storage statistics",
      details: error.message,
    });
  }
};
