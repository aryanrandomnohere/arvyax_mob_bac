import express from "express";
import AWS from "aws-sdk";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { dirname } from "path";
import HLSVideoStorage from "../models/HLSVideoStorage.js";
import {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
} from "../config/constants.js";

/**
 * HLS Video Storage Routes
 * Manages HLS (HTTP Live Streaming) video processing, upload, and delivery
 * Converts regular videos to HLS format for adaptive bitrate streaming
 * Uses Cloudflare R2 for scalable, cost-effective video storage
 *
 * Features:
 * - Upload and convert videos to HLS format
 * - FFmpeg-based video processing with segment generation
 * - Convert existing videos to HLS
 * - List, search, and filter HLS videos
 * - Delete HLS videos with all segments
 * - Video statistics and analytics
 */

// Needed for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Initialize Cloudflare R2 (S3-compatible API)
const r2 = new AWS.S3({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  region: "auto",
  endpoint: R2_ENDPOINT,
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

const BUCKET_NAME = R2_BUCKET_NAME;
const PUBLIC_R2_URL = R2_PUBLIC_URL;

// Configure multer for memory storage (2GB limit for videos)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video files only
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed!"), false);
    }
  },
});

/**
 * Convert internal R2 endpoint URL to public CDN URL
 * @param {string} r2Key - The R2 storage key/path
 * @returns {string} Public accessible URL
 */
const getPublicUrl = (r2Key) => {
  return `${PUBLIC_R2_URL}/${r2Key}`;
};

/**
 * Create temporary directory for video processing
 * @returns {string} Path to temporary directory
 */
const createTempDir = () => {
  const tempDir = path.join(__dirname, "../../temp", uuidv4());
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
};

/**
 * Clean up temporary files and directories
 * @param {string} tempDir - Path to temporary directory to clean up
 */
const cleanupTempDir = (tempDir) => {
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`🧹 Cleaned up temp directory: ${tempDir}`);
    }
  } catch (error) {
    console.error("Error cleaning up temp directory:", error);
  }
};

/**
 * Upload file to Cloudflare R2
 * @param {string} filePath - Local file path
 * @param {string} r2Key - R2 storage key
 * @param {string} contentType - MIME type
 * @returns {Promise<Object>} Upload result
 */
const uploadToR2 = async (
  filePath,
  r2Key,
  contentType = "application/octet-stream"
) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: {
        "generated-by": "hls-video-processor",
        "upload-timestamp": new Date().toISOString(),
      },
    };

    const result = await r2.upload(uploadParams).promise();
    console.log(`✅ Uploaded to R2: ${r2Key}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to upload ${r2Key} to R2:`, error);
    throw error;
  }
};

/**
 * Convert video to HLS format using FFmpeg
 * Creates playlist.m3u8 and multiple .ts segments
 * @param {string} inputPath - Input video file path
 * @param {string} outputDir - Output directory for HLS files
 * @param {string} videoId - Unique video identifier
 * @returns {Promise<string>} Path to generated playlist
 */
const convertToHLS = (inputPath, outputDir, videoId) => {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(outputDir, "playlist.m3u8");

    console.log(`🎬 Starting HLS conversion for video: ${videoId}`);
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📁 Output: ${outputPath}`);

    ffmpeg(inputPath)
      .outputOptions([
        "-c:v libx264", // Video codec
        "-c:a aac", // Audio codec
        "-hls_time 10", // Segment duration (10 seconds)
        "-hls_list_size 0", // Keep all segments in playlist
        "-hls_segment_filename",
        path.join(outputDir, "segment_%03d.ts"),
        "-f hls", // Output format
      ])
      .output(outputPath)
      .on("start", (commandLine) => {
        console.log(`🚀 FFmpeg command: ${commandLine}`);
      })
      .on("progress", (progress) => {
        console.log(
          `⏳ Processing: ${Math.round(progress.percent || 0)}% done`
        );
      })
      .on("end", () => {
        console.log(`✅ HLS conversion completed for video: ${videoId}`);
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error(`❌ HLS conversion failed for video ${videoId}:`, err);
        reject(err);
      })
      .run();
  });
};

/**
 * Get video metadata using FFprobe
 * @param {string} inputPath - Video file path
 * @returns {Promise<Object>} Video metadata (duration, codecs, resolution, etc.)
 */
const getVideoInfo = (inputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const videoStream = metadata.streams.find(
          (stream) => stream.codec_type === "video"
        );
        const audioStream = metadata.streams.find(
          (stream) => stream.codec_type === "audio"
        );

        resolve({
          duration: metadata.format.duration,
          size: metadata.format.size,
          bitrate: metadata.format.bit_rate,
          video: videoStream
            ? {
                codec: videoStream.codec_name,
                width: videoStream.width,
                height: videoStream.height,
                framerate: videoStream.avg_frame_rate,
              }
            : null,
          audio: audioStream
            ? {
                codec: audioStream.codec_name,
                sampleRate: audioStream.sample_rate,
                channels: audioStream.channels,
              }
            : null,
        });
      }
    });
  });
};

/**
 * POST /api/upload-hls-video
 * Upload video and convert to HLS format
 *
 * Body: multipart/form-data
 * - video (required): Video file
 * - title (required): Video title
 * - description (optional): Video description
 * - tags (optional): Comma-separated tags
 * - isPublic (optional): Public accessibility (default: true)
 *
 * Returns: Video metadata with HLS playlist URL
 */
const uploadHLSVideoHandler = async (req, res) => {
  let tempDir = null;

  try {
    const { title, description = "", tags = [], isPublic = true } = req.body;
    const file = req.file;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Title is required",
      });
    }

    if (!file) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Video file is required",
      });
    }

    // Create temporary directory
    tempDir = createTempDir();
    const inputPath = path.join(tempDir, file.originalname);

    // Save uploaded file to temp directory
    fs.writeFileSync(inputPath, file.buffer);

    console.log("\n=== Starting HLS Video Processing ===");
    console.log("Title:", title);
    console.log("Original filename:", file.originalname);
    console.log("File size:", (file.size / (1024 * 1024)).toFixed(2), "MB");
    console.log("Temp directory:", tempDir);
    console.log("=====================================\n");

    // Get video information
    const videoInfo = await getVideoInfo(inputPath);
    console.log("📊 Video Info:", videoInfo);

    // Generate unique identifiers
    const videoId = uuidv4();
    const hlsDir = path.join(tempDir, "hls");
    fs.mkdirSync(hlsDir, { recursive: true });

    // Convert to HLS
    await convertToHLS(inputPath, hlsDir, videoId);

    // Upload original video to R2
    const originalKey = `videos/original/${videoId}.${file.originalname
      .split(".")
      .pop()}`;
    await uploadToR2(inputPath, originalKey, file.mimetype);

    // Upload HLS files to R2
    const hlsFiles = fs.readdirSync(hlsDir);
    const hlsKeys = [];

    console.log(`📦 Uploading ${hlsFiles.length} HLS files to R2...`);

    for (const hlsFile of hlsFiles) {
      const hlsFilePath = path.join(hlsDir, hlsFile);
      const hlsKey = `videos/hls/${videoId}/${hlsFile}`;

      let contentType = "application/octet-stream";
      if (hlsFile.endsWith(".m3u8")) {
        contentType = "application/vnd.apple.mpegurl";
      } else if (hlsFile.endsWith(".ts")) {
        contentType = "video/mp2t";
      }

      await uploadToR2(hlsFilePath, hlsKey, contentType);
      hlsKeys.push(hlsKey);
    }

    // Parse tags
    const parsedTags =
      typeof tags === "string"
        ? tags.split(",").map((tag) => tag.trim())
        : tags;

    // Create video document with HLS info
    const video = await HLSVideoStorage.create({
      title,
      description,
      tags: parsedTags,
      isPublic: isPublic === "true" || isPublic === true,
      url: getPublicUrl(`videos/hls/${videoId}/playlist.m3u8`), // HLS playlist URL
      originalUrl: getPublicUrl(originalKey), // Original video URL
      s3Key: `videos/hls/${videoId}/playlist.m3u8`, // HLS playlist key
      originalS3Key: originalKey, // Original video key
      s3Bucket: BUCKET_NAME,
      fileSize: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
      uploadStatus: "completed",
      isHLS: true,
      hlsKeys: hlsKeys,
      videoInfo: videoInfo,
      hlsSegments: hlsFiles.filter((f) => f.endsWith(".ts")).length,
      processingTime: new Date(),
      storageProvider: "cloudflare-r2",
    });

    console.log("\n=== HLS Video Successfully Processed ===");
    console.log("Title:", video.title);
    console.log("MongoDB ID:", video._id);
    console.log("HLS Playlist URL:", video.url);
    console.log("Original Video URL:", video.originalUrl);
    console.log("HLS Segments:", video.hlsSegments);
    console.log("Duration:", videoInfo.duration, "seconds");
    console.log(
      "Resolution:",
      videoInfo.video
        ? `${videoInfo.video.width}x${videoInfo.video.height}`
        : "Unknown"
    );
    console.log("=========================================\n");

    res.status(201).json({
      success: true,
      video,
      storage: "cloudflare-r2-hls",
      processing: {
        originalSize: file.size,
        duration: videoInfo.duration,
        segments: video.hlsSegments,
        resolution: videoInfo.video
          ? `${videoInfo.video.width}x${videoInfo.video.height}`
          : null,
      },
    });
  } catch (error) {
    console.error("Error processing HLS video:", error);
    res.status(500).json({
      error: "Failed to process HLS video",
      details: error.message,
    });
  } finally {
    // Clean up temporary files
    if (tempDir) {
      cleanupTempDir(tempDir);
    }
  }
};

router.post("/upload-hls-video", upload.single("video"), uploadHLSVideoHandler);

/**
 * GET /api/get-hls-videos
 * Get all HLS videos from storage
 *
 * Returns: Array of all HLS video objects with metadata
 */
const getAllHLSVideosHandler = async (req, res) => {
  try {
    const videos = await HLSVideoStorage.find({ isHLS: true }).sort({
      createdAt: -1,
    });
    console.log(`Retrieved ${videos.length} HLS videos from database`);
    res.json({
      success: true,
      videos,
      storage: "cloudflare-r2-hls",
      total: videos.length,
    });
  } catch (error) {
    console.error("Error fetching HLS videos:", error);
    res.status(500).json({
      error: "Failed to fetch HLS videos",
      details: error.message,
    });
  }
};

router.get("/get-hls-videos", getAllHLSVideosHandler);

/**
 * GET /api/get-hls-video/:id
 * Get single HLS video by ID
 *
 * Params:
 * - id (required): MongoDB document ID
 *
 * Returns: Video object with HLS metadata
 */
router.get("/get-hls-video/:id", async (req, res) => {
  try {
    const video = await HLSVideoStorage.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        error: "Video not found",
      });
    }

    if (!video.isHLS) {
      return res.status(400).json({
        success: false,
        error: "Video is not in HLS format",
      });
    }

    res.json({
      success: true,
      video,
      storage: "cloudflare-r2-hls",
    });
  } catch (error) {
    console.error("Error fetching HLS video:", error);
    res.status(500).json({
      error: "Failed to fetch HLS video",
      details: error.message,
    });
  }
});

/**
 * POST /api/convert-to-hls/:id
 * Convert existing video to HLS format
 *
 * Params:
 * - id (required): MongoDB document ID of existing video
 *
 * Returns: Updated video object with HLS metadata
 */
router.post("/convert-to-hls/:id", async (req, res) => {
  let tempDir = null;

  try {
    const video = await HLSVideoStorage.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        error: "Video not found",
      });
    }

    if (video.isHLS) {
      return res.status(400).json({
        success: false,
        error: "Video is already in HLS format",
      });
    }

    console.log(`🔄 Converting existing video to HLS: ${video.title}`);

    // Create temporary directory
    tempDir = createTempDir();
    const inputPath = path.join(tempDir, video.originalName || "video.mp4");

    // Download original video from R2
    const downloadParams = {
      Bucket: BUCKET_NAME,
      Key: video.s3Key,
    };

    const videoData = await r2.getObject(downloadParams).promise();
    fs.writeFileSync(inputPath, videoData.Body);

    // Get video information
    const videoInfo = await getVideoInfo(inputPath);

    // Generate new HLS directory
    const videoId = uuidv4();
    const hlsDir = path.join(tempDir, "hls");
    fs.mkdirSync(hlsDir, { recursive: true });

    // Convert to HLS
    await convertToHLS(inputPath, hlsDir, videoId);

    // Upload HLS files to R2
    const hlsFiles = fs.readdirSync(hlsDir);
    const hlsKeys = [];

    console.log(`📦 Uploading ${hlsFiles.length} HLS files to R2...`);

    for (const hlsFile of hlsFiles) {
      const hlsFilePath = path.join(hlsDir, hlsFile);
      const hlsKey = `videos/hls/${videoId}/${hlsFile}`;

      let contentType = "application/octet-stream";
      if (hlsFile.endsWith(".m3u8")) {
        contentType = "application/vnd.apple.mpegurl";
      } else if (hlsFile.endsWith(".ts")) {
        contentType = "video/mp2t";
      }

      await uploadToR2(hlsFilePath, hlsKey, contentType);
      hlsKeys.push(hlsKey);
    }

    // Update video document with HLS info
    const updatedVideo = await HLSVideoStorage.findByIdAndUpdate(
      req.params.id,
      {
        originalUrl: video.url, // Keep original URL
        url: getPublicUrl(`videos/hls/${videoId}/playlist.m3u8`), // New HLS playlist URL
        originalS3Key: video.s3Key, // Keep original key
        s3Key: `videos/hls/${videoId}/playlist.m3u8`, // New HLS playlist key
        isHLS: true,
        hlsKeys: hlsKeys,
        videoInfo: videoInfo,
        hlsSegments: hlsFiles.filter((f) => f.endsWith(".ts")).length,
        processingTime: new Date(),
        storageProvider: "cloudflare-r2",
        updatedAt: new Date(),
      },
      { new: true }
    );

    console.log(
      `✅ Successfully converted video to HLS: ${updatedVideo.title}`
    );

    res.json({
      success: true,
      message: "Video converted to HLS successfully",
      video: updatedVideo,
      storage: "cloudflare-r2-hls",
      processing: {
        duration: videoInfo.duration,
        segments: updatedVideo.hlsSegments,
        resolution: videoInfo.video
          ? `${videoInfo.video.width}x${videoInfo.video.height}`
          : null,
      },
    });
  } catch (error) {
    console.error("Error converting video to HLS:", error);
    res.status(500).json({
      error: "Failed to convert video to HLS",
      details: error.message,
    });
  } finally {
    // Clean up temporary files
    if (tempDir) {
      cleanupTempDir(tempDir);
    }
  }
});

/**
 * DELETE /api/delete-hls-video/:id
 * Delete HLS video including all segments
 *
 * Params:
 * - id (required): MongoDB document ID
 *
 * Returns: Deletion status with cleanup info
 */
router.delete("/delete-hls-video/:id", async (req, res) => {
  try {
    const video = await HLSVideoStorage.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        error: "Video not found",
      });
    }

    console.log(`🗑️ Deleting HLS video: ${video.title}`);

    // Delete all HLS files from R2
    const deletePromises = [];

    if (video.hlsKeys && video.hlsKeys.length > 0) {
      for (const hlsKey of video.hlsKeys) {
        const deleteParams = {
          Bucket: BUCKET_NAME,
          Key: hlsKey,
        };
        deletePromises.push(r2.deleteObject(deleteParams).promise());
      }
    }

    // Delete original video if exists
    if (video.originalS3Key) {
      const deleteParams = {
        Bucket: BUCKET_NAME,
        Key: video.originalS3Key,
      };
      deletePromises.push(r2.deleteObject(deleteParams).promise());
    }

    // Execute all deletions
    await Promise.all(deletePromises);

    // Delete from database
    await HLSVideoStorage.findByIdAndDelete(req.params.id);

    console.log(`✅ Successfully deleted HLS video: ${video.title}`);

    res.json({
      success: true,
      message: "HLS video deleted successfully",
      videoId: req.params.id,
      title: video.title,
      deletedFiles: video.hlsKeys ? video.hlsKeys.length : 0,
      storage: "cloudflare-r2-hls",
    });
  } catch (error) {
    console.error("Error deleting HLS video:", error);
    res.status(500).json({
      error: "Failed to delete HLS video",
      details: error.message,
    });
  }
});

/**
 * GET /api/hls-video-stats
 * Get comprehensive HLS video statistics
 * Includes total videos, storage usage, segments, duration, resolution breakdown
 *
 * Returns: Detailed HLS video statistics
 */
router.get("/hls-video-stats", async (req, res) => {
  try {
    const hlsVideos = await HLSVideoStorage.find({ isHLS: true });

    const stats = {
      totalVideos: hlsVideos.length,
      totalSize: hlsVideos.reduce(
        (sum, video) => sum + (video.fileSize || 0),
        0
      ),
      totalSegments: hlsVideos.reduce(
        (sum, video) => sum + (video.hlsSegments || 0),
        0
      ),
      totalDuration: hlsVideos.reduce((sum, video) => {
        return (
          sum +
          (video.videoInfo && video.videoInfo.duration
            ? video.videoInfo.duration
            : 0)
        );
      }, 0),
      avgSegmentsPerVideo:
        hlsVideos.length > 0
          ? hlsVideos.reduce(
              (sum, video) => sum + (video.hlsSegments || 0),
              0
            ) / hlsVideos.length
          : 0,
      resolutions: {},
    };

    // Calculate resolution distribution
    hlsVideos.forEach((video) => {
      if (video.videoInfo && video.videoInfo.video) {
        const resolution = `${video.videoInfo.video.width}x${video.videoInfo.video.height}`;
        stats.resolutions[resolution] =
          (stats.resolutions[resolution] || 0) + 1;
      }
    });

    res.json({
      success: true,
      storage: "cloudflare-r2-hls",
      stats: {
        ...stats,
        totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
        totalSizeGB: (stats.totalSize / (1024 * 1024 * 1024)).toFixed(2),
        totalDurationHours: (stats.totalDuration / 3600).toFixed(2),
        avgSegmentsPerVideo: stats.avgSegmentsPerVideo.toFixed(1),
      },
    });
  } catch (error) {
    console.error("Error getting HLS video stats:", error);
    res.status(500).json({
      error: "Failed to get HLS video statistics",
      details: error.message,
    });
  }
});

/**
 * GET /api/search-hls-videos
 * Search HLS videos by title, description, tags, or visibility
 *
 * Query params:
 * - q (optional): Search query
 * - tags (optional): Comma-separated tags
 * - isPublic (optional): Filter by public/private
 * - limit (optional): Results per page (default: 20)
 * - skip (optional): Results to skip (default: 0)
 * - sortBy (optional): Sort field (default: "createdAt")
 * - sortOrder (optional): "asc" or "desc" (default: "desc")
 *
 * Returns: Filtered and paginated video list
 */
router.get("/search-hls-videos", async (req, res) => {
  try {
    const {
      q,
      tags,
      isPublic,
      limit = 20,
      skip = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let query = { isHLS: true };

    // Text search
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    // Tag filter
    if (tags) {
      const tagArray = tags.split(",").map((tag) => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Public/Private filter
    if (isPublic !== undefined) {
      query.isPublic = isPublic === "true";
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const videos = await HLSVideoStorage.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalCount = await HLSVideoStorage.countDocuments(query);

    res.json({
      success: true,
      storage: "cloudflare-r2-hls",
      videos,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: totalCount > parseInt(skip) + parseInt(limit),
      },
      query: { q, tags, isPublic, sortBy, sortOrder },
    });
  } catch (error) {
    console.error("Error searching HLS videos:", error);
    res.status(500).json({
      error: "Failed to search HLS videos",
      details: error.message,
    });
  }
});

export default router;
