import express from "express";
import AWS from "aws-sdk";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import VideoS3 from "../models/VideoS3.js";
import {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
} from "../config/constants.js";

/**
 * Cloudflare R2 Video Storage Routes
 * Manages video uploads, downloads, deletion, and metadata for the wellness platform
 * Uses Cloudflare R2 (S3-compatible) for scalable, cost-effective video storage
 *
 * Features:
 * - Single video upload with metadata
 * - Video deletion with retry logic
 * - Video listing, searching, and filtering
 * - Storage statistics and analytics
 * - Public URL generation for video access
 * - R2 sync checking and cleanup tools
 */

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
 * Retry logic for R2 deletion with exponential backoff
 * @param {string} r2Key - The R2 key to delete
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object>} Success/failure status
 */
const retryR2Delete = async (r2Key, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔄 R2 delete attempt ${attempt}/${maxRetries} for: ${r2Key}`
      );

      const deleteParams = {
        Bucket: BUCKET_NAME,
        Key: r2Key,
      };

      const result = await r2.deleteObject(deleteParams).promise();

      console.log(`✅ R2 delete SUCCESS on attempt ${attempt}:`, result);
      return { success: true, result };
    } catch (error) {
      console.error(`❌ R2 delete attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        return { success: false, error: error.message };
      }

      // Wait before retry (exponential backoff: 2s, 4s, 8s)
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * GET /api/get-r2-videos
 * Get all videos from Cloudflare R2
 *
 * Returns: Array of all video objects with metadata
 */
const getAllVideosHandler = async (req, res) => {
  try {
    const videos = await VideoS3.find().sort({ createdAt: -1 });
    console.log(
      `Retrieved ${videos.length} videos from database (Cloudflare R2)`
    );
    res.json(videos);
  } catch (error) {
    console.error("Error fetching R2 videos:", error);
    res.status(500).json({
      error: "Failed to fetch R2 videos",
      details: error.message,
    });
  }
};

router.get("/get-r2-videos", getAllVideosHandler);
router.get("/get-videos", getAllVideosHandler); // Generic alias for backward compatibility

/**
 * POST /api/upload-r2-video
 * Upload a single video to Cloudflare R2
 *
 * Body: multipart/form-data
 * - video (required): Video file
 * - title (required): Video title/name
 * - description (optional): Video description
 * - tags (optional): Comma-separated tags
 * - isPublic (optional): Whether video is publicly accessible (default: true)
 *
 * Returns: Video metadata with public URL
 */
const uploadVideoHandler = async (req, res) => {
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

    // Generate unique filename
    const fileExtension = file.originalname.split(".").pop();
    const r2Key = `videos/${uuidv4()}.${fileExtension}`;

    console.log("\n=== Starting Cloudflare R2 Upload ===");
    console.log("Title:", title);
    console.log("Original filename:", file.originalname);
    console.log("File size:", (file.size / (1024 * 1024)).toFixed(2), "MB");
    console.log("R2 Key:", r2Key);
    console.log("=====================================\n");

    // Upload to Cloudflare R2
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        "original-name": file.originalname,
        "uploaded-by": "video-management-system",
        title: title,
        "upload-timestamp": new Date().toISOString(),
      },
    };

    const r2Result = await r2.upload(uploadParams).promise();

    console.log("✅ Cloudflare R2 Upload successful:", r2Result.Location);

    // Generate public URL
    const publicUrl = getPublicUrl(r2Key);

    // Parse tags
    const parsedTags =
      typeof tags === "string"
        ? tags.split(",").map((tag) => tag.trim())
        : tags;

    // Create new video document
    const video = await VideoS3.create({
      title,
      description,
      tags: parsedTags,
      isPublic: isPublic === "true" || isPublic === true,
      url: publicUrl,
      s3Key: r2Key,
      s3Bucket: BUCKET_NAME,
      fileSize: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
      uploadStatus: "completed",
    });

    console.log("\n=== Video Successfully Stored in Cloudflare R2 ===");
    console.log("Title:", video.title);
    console.log("MongoDB ID:", video._id);
    console.log("Public URL:", video.url);
    console.log("R2 Key:", video.s3Key);
    console.log(
      "File Size:",
      (video.fileSize / (1024 * 1024)).toFixed(2),
      "MB"
    );
    console.log("Tags:", video.tags);
    console.log("Public:", video.isPublic);
    console.log("================================================\n");

    res.status(201).json({
      success: true,
      video,
      storage: "cloudflare-r2",
    });
  } catch (error) {
    console.error("Error uploading video to Cloudflare R2:", error);
    res.status(500).json({
      error: "Failed to upload video to Cloudflare R2",
      details: error.message,
    });
  }
};

router.post("/upload-r2-video", upload.single("video"), uploadVideoHandler);
router.post("/upload-video", upload.single("video"), uploadVideoHandler); // Generic alias for backward compatibility

/**
 * POST /api/upload-r2-video-url
 * Save video metadata via URL (for videos already uploaded to R2)
 *
 * Body: JSON
 * - title (required): Video title
 * - url (required): Public URL
 * - r2Key (required): R2 storage key
 * - description (optional): Video description
 * - tags (optional): Comma-separated tags
 * - isPublic (optional): Public accessibility flag
 *
 * Returns: Video metadata object
 */
const saveVideoUrlHandler = async (req, res) => {
  try {
    let {
      title,
      url,
      r2Key,
      description = "",
      tags = [],
      isPublic = true,
    } = req.body;

    // Validate required fields
    if (!title || !url || !r2Key) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Title, URL, and r2Key are required",
      });
    }

    // If URL is internal R2 endpoint, convert to public URL
    if (url.includes("r2.cloudflarestorage.com")) {
      url = getPublicUrl(r2Key);
    }

    const parsedTags =
      typeof tags === "string"
        ? tags.split(",").map((tag) => tag.trim())
        : tags;

    // Create new video document
    const video = await VideoS3.create({
      title,
      description,
      tags: parsedTags,
      isPublic: isPublic === "true" || isPublic === true,
      url,
      s3Key: r2Key,
      s3Bucket: BUCKET_NAME,
      uploadStatus: "completed",
    });

    console.log("\n=== Video URL Successfully Stored (R2) ===");
    console.log("Title:", video.title);
    console.log("MongoDB ID:", video._id);
    console.log("Public URL:", video.url);
    console.log("R2 Key:", video.s3Key);
    console.log("======================================\n");

    res.status(201).json({
      success: true,
      video,
      storage: "cloudflare-r2",
    });
  } catch (error) {
    console.error("Error saving R2 video URL:", error);
    res.status(500).json({
      error: "Failed to save R2 video URL",
      details: error.message,
    });
  }
};

router.post("/upload-r2-video-url", saveVideoUrlHandler);

/**
 * DELETE /api/delete-r2-video/:id
 * Delete video from Cloudflare R2 with retry logic
 *
 * Params:
 * - id (required): MongoDB document ID
 *
 * Returns: Success/failure status with cleanup info
 */
const deleteVideoHandler = async (req, res) => {
  const videoId = req.params.id;

  try {
    // First, find the video to get R2 info
    const video = await VideoS3.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        error: "Video not found",
      });
    }

    console.log(`\n🗑️  Starting R2 deletion for Video: ${video.title}`);
    console.log(`🆔 Video ID: ${videoId}`);
    console.log(`🪣 R2 Key: ${video.s3Key}`);
    console.log(`🪣 R2 Bucket: ${video.s3Bucket}`);

    // Try R2 deletion first with retries
    const r2Result = await retryR2Delete(video.s3Key);

    if (!r2Result.success) {
      console.log(
        `⚠️  R2 deletion failed after retries. Proceeding with database cleanup.`
      );
      console.log(`📝 Manual cleanup needed for R2 Key: ${video.s3Key}`);
    }

    // Delete from database (always do this)
    await VideoS3.findByIdAndDelete(videoId);
    console.log(`✅ Database deletion: SUCCESS`);

    // Response based on results
    const response = {
      success: true,
      message: "Video deleted successfully from Cloudflare R2",
      videoId: videoId,
      title: video.title,
      r2Deleted: r2Result.success,
      storage: "cloudflare-r2",
    };

    if (!r2Result.success) {
      response.warning =
        "Video removed from database, but R2 cleanup failed. Please check manually.";
      response.r2Key = video.s3Key;
      response.r2Bucket = video.s3Bucket;
    }

    res.json(response);
  } catch (error) {
    console.error(`❌ Delete error for R2 video ${videoId}:`, error.message);
    res.status(500).json({
      success: false,
      error: "Failed to delete R2 video",
      details: error.message,
    });
  }
};

router.delete("/delete-r2-video/:id", deleteVideoHandler);
router.delete("/delete-video/:id", deleteVideoHandler); // Generic alias for backward compatibility

/**
 * DELETE /api/cleanup-r2/:r2Key
 * Manual cleanup for failed R2 deletions
 *
 * Params:
 * - r2Key (required): The R2 storage key to cleanup
 *
 * Returns: Cleanup status
 */
router.delete("/cleanup-r2/:r2Key(*)", async (req, res) => {
  const r2Key = req.params.r2Key;

  try {
    console.log(`🧹 Manual R2 cleanup for: ${r2Key}`);

    const result = await retryR2Delete(r2Key);

    if (result.success) {
      res.json({
        success: true,
        message: "R2 cleanup successful",
        r2Key: r2Key,
        result: result.result,
        storage: "cloudflare-r2",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "R2 cleanup failed",
        r2Key: r2Key,
        details: result.error,
        storage: "cloudflare-r2",
      });
    }
  } catch (error) {
    console.error(`❌ Manual R2 cleanup error:`, error.message);
    res.status(500).json({
      success: false,
      error: "Manual R2 cleanup failed",
      details: error.message,
    });
  }
});

/**
 * GET /api/check-r2-sync
 * Check synchronization between database and R2 storage
 * Lists orphaned videos (in DB but not in R2)
 *
 * Returns: Sync status with list of orphaned videos
 */
router.get("/check-r2-sync", async (req, res) => {
  try {
    const videos = await VideoS3.find().select(
      "title s3Key s3Bucket createdAt tags isPublic"
    );

    console.log(`🔍 Checking R2 sync for ${videos.length} videos...`);

    const checkResults = [];

    for (const video of videos) {
      try {
        // Check if object exists in R2
        const headParams = {
          Bucket: video.s3Bucket || BUCKET_NAME,
          Key: video.s3Key,
        };

        const result = await r2.headObject(headParams).promise();

        checkResults.push({
          videoId: video._id,
          title: video.title,
          r2Key: video.s3Key,
          r2Bucket: video.s3Bucket,
          tags: video.tags,
          isPublic: video.isPublic,
          status: "exists",
          r2Info: {
            size: result.ContentLength,
            lastModified: result.LastModified,
            contentType: result.ContentType,
          },
        });
      } catch (error) {
        checkResults.push({
          videoId: video._id,
          title: video.title,
          r2Key: video.s3Key,
          r2Bucket: video.s3Bucket,
          tags: video.tags,
          isPublic: video.isPublic,
          status: "not_found",
          error: error.message,
        });
      }
    }

    const orphanedVideos = checkResults.filter((r) => r.status === "not_found");

    res.json({
      success: true,
      storage: "cloudflare-r2",
      totalVideos: videos.length,
      syncedVideos: checkResults.filter((r) => r.status === "exists").length,
      orphanedVideos: orphanedVideos.length,
      results: checkResults,
      orphanedList: orphanedVideos,
    });
  } catch (error) {
    console.error(`❌ R2 sync check error:`, error.message);
    res.status(500).json({
      success: false,
      error: "Failed to check R2 sync",
      details: error.message,
    });
  }
});

/**
 * GET /api/r2-bucket-info
 * Get Cloudflare R2 bucket information
 * Lists all video objects in the bucket
 *
 * Returns: Bucket statistics and object list
 */
router.get("/r2-bucket-info", async (req, res) => {
  try {
    // List objects in bucket
    const listParams = {
      Bucket: BUCKET_NAME,
      Prefix: "videos/",
      MaxKeys: 1000,
    };

    const r2Objects = await r2.listObjectsV2(listParams).promise();

    // Calculate total size
    const totalSize = r2Objects.Contents.reduce(
      (sum, obj) => sum + obj.Size,
      0
    );

    res.json({
      success: true,
      storage: "cloudflare-r2",
      bucketName: BUCKET_NAME,
      publicUrl: PUBLIC_R2_URL,
      totalObjects: r2Objects.KeyCount,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
      objects: r2Objects.Contents
        ? r2Objects.Contents.map((obj) => ({
            key: obj.Key,
            size: obj.Size,
            sizeMB: (obj.Size / (1024 * 1024)).toFixed(2),
            lastModified: obj.LastModified,
            publicUrl: getPublicUrl(obj.Key),
          }))
        : [],
    });
  } catch (error) {
    console.error(`❌ R2 bucket info error:`, error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get R2 bucket info",
      details: error.message,
    });
  }
});

/**
 * GET /api/r2-video-stats
 * Get comprehensive video statistics
 * Includes storage stats, tag distribution, and visibility breakdown
 *
 * Returns: Detailed video statistics
 */
router.get("/r2-video-stats", async (req, res) => {
  try {
    const stats = await VideoS3.getStats();

    // Additional aggregations
    const tagStats = await VideoS3.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const publicPrivateStats = await VideoS3.aggregate([
      {
        $group: {
          _id: "$isPublic",
          count: { $sum: 1 },
          totalSize: { $sum: "$fileSize" },
        },
      },
    ]);

    const uploadStatusStats = await VideoS3.aggregate([
      {
        $group: {
          _id: "$uploadStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      storage: "cloudflare-r2",
      publicUrl: PUBLIC_R2_URL,
      generalStats: {
        ...stats,
        totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
        totalSizeGB: (stats.totalSize / (1024 * 1024 * 1024)).toFixed(2),
        avgFileSizeMB: (stats.avgFileSize / (1024 * 1024)).toFixed(2),
        avgDurationMinutes: (stats.avgDuration / 60).toFixed(2),
      },
      topTags: tagStats,
      visibilityStats: publicPrivateStats,
      uploadStatusStats: uploadStatusStats,
    });
  } catch (error) {
    console.error(`❌ R2 video stats error:`, error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get R2 video statistics",
      details: error.message,
    });
  }
});

/**
 * GET /api/search-r2-videos
 * Search videos by title, description, tags, or visibility
 *
 * Query params:
 * - q (optional): Search query (searches title and description)
 * - tags (optional): Comma-separated tags to filter by
 * - isPublic (optional): Filter by public/private status
 * - limit (optional): Maximum results to return (default: 20)
 * - skip (optional): Number of results to skip for pagination (default: 0)
 * - sortBy (optional): Field to sort by (default: "createdAt")
 * - sortOrder (optional): Sort direction "asc" or "desc" (default: "desc")
 *
 * Returns: Filtered and paginated video list
 */
router.get("/search-r2-videos", async (req, res) => {
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

    let query = {};

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

    const videos = await VideoS3.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalCount = await VideoS3.countDocuments(query);

    res.json({
      success: true,
      storage: "cloudflare-r2",
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
    console.error(`❌ R2 video search error:`, error.message);
    res.status(500).json({
      success: false,
      error: "Failed to search R2 videos",
      details: error.message,
    });
  }
});

/**
 * PUT /api/update-r2-video/:id
 * Update video metadata (does not change the video file)
 *
 * Params:
 * - id (required): MongoDB document ID
 *
 * Body: JSON (all optional)
 * - title: Video title
 * - description: Video description
 * - tags: Array of tags
 * - isPublic: Public visibility flag
 * - duration: Video duration in seconds
 * - thumbnailUrl: Thumbnail image URL
 *
 * Returns: Updated video object
 */
router.put("/update-r2-video/:id", async (req, res) => {
  try {
    const videoId = req.params.id;
    const updates = req.body;

    // Don't allow updating certain fields
    delete updates.url;
    delete updates.s3Key;
    delete updates.s3Bucket;
    delete updates.fileSize;
    delete updates.createdAt;

    // Parse tags if provided as string
    if (updates.tags && typeof updates.tags === "string") {
      updates.tags = updates.tags.split(",").map((tag) => tag.trim());
    }

    const video = await VideoS3.findByIdAndUpdate(
      videoId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        error: "Video not found",
      });
    }

    console.log(`✅ Video metadata updated: ${video.title}`);

    res.json({
      success: true,
      message: "Video updated successfully",
      video,
      storage: "cloudflare-r2",
    });
  } catch (error) {
    console.error(`❌ R2 video update error:`, error.message);
    res.status(500).json({
      success: false,
      error: "Failed to update R2 video",
      details: error.message,
    });
  }
});

/**
 * POST /api/fix-video-urls
 * Fix existing videos with wrong URLs (one-time migration utility)
 * Converts internal R2 URLs to public CDN URLs
 *
 * Returns: List of updated videos
 */
router.post("/fix-video-urls", async (req, res) => {
  try {
    const videos = await VideoS3.find({
      url: { $regex: "r2.cloudflarestorage.com" },
    });

    console.log(`🔧 Found ${videos.length} videos with internal URLs to fix`);

    const updates = [];

    for (const video of videos) {
      const publicUrl = getPublicUrl(video.s3Key);

      await VideoS3.findByIdAndUpdate(video._id, {
        url: publicUrl,
      });

      updates.push({
        id: video._id,
        title: video.title,
        oldUrl: video.url,
        newUrl: publicUrl,
      });
    }

    console.log(`✅ Updated ${updates.length} video URLs to public URLs`);

    res.json({
      success: true,
      message: `Fixed ${updates.length} video URLs`,
      updates: updates,
      storage: "cloudflare-r2",
    });
  } catch (error) {
    console.error(`❌ Fix URLs error:`, error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fix video URLs",
      details: error.message,
    });
  }
});

/**
 * ==============================================
 * AWS S3 BACKWARD COMPATIBILITY ALIASES
 * ==============================================
 * These routes maintain compatibility with the old backend
 * which used AWS S3. Since we're using Cloudflare R2 (S3-compatible),
 * these endpoints simply map to the R2 endpoints with the same functionality
 */

// Backward compatible S3 route aliases
router.get("/get-s3-videos", getAllVideosHandler);
router.post("/upload-s3-video", upload.single("video"), uploadVideoHandler);
router.post("/upload-s3-video-url", saveVideoUrlHandler);
router.delete("/delete-s3-video/:id", deleteVideoHandler);
router.delete("/cleanup-s3/:s3Key(*)", async (req, res) => {
  const r2Key = req.params.s3Key;

  try {
    console.log(`🧹 Manual S3 cleanup for: ${r2Key}`);

    const result = await retryR2Delete(r2Key);

    if (result.success) {
      res.json({
        success: true,
        message: "S3 cleanup successful",
        s3Key: r2Key,
        result: result.result,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "S3 cleanup failed",
        s3Key: r2Key,
        details: result.error,
      });
    }
  } catch (error) {
    console.error(`❌ Manual S3 cleanup error:`, error.message);
    res.status(500).json({
      success: false,
      error: "Manual S3 cleanup failed",
      details: error.message,
    });
  }
});

router.get("/check-s3-sync", async (req, res) => {
  try {
    const videos = await VideoS3.find().select(
      "title s3Key s3Bucket createdAt"
    );

    console.log(`🔍 Checking S3 sync for ${videos.length} videos...`);

    const checkResults = [];

    for (const video of videos) {
      try {
        // Check if object exists in R2
        const headParams = {
          Bucket: video.s3Bucket || BUCKET_NAME,
          Key: video.s3Key,
        };

        const result = await r2.headObject(headParams).promise();

        checkResults.push({
          videoId: video._id,
          title: video.title,
          s3Key: video.s3Key,
          s3Bucket: video.s3Bucket,
          status: "exists",
          s3Info: {
            size: result.ContentLength,
            lastModified: result.LastModified,
            contentType: result.ContentType,
          },
        });
      } catch (error) {
        checkResults.push({
          videoId: video._id,
          title: video.title,
          s3Key: video.s3Key,
          s3Bucket: video.s3Bucket,
          status: "not_found",
          error: error.message,
        });
      }
    }

    const orphanedVideos = checkResults.filter((r) => r.status === "not_found");

    res.json({
      success: true,
      storage: "cloudflare-r2",
      totalVideos: videos.length,
      syncedVideos: checkResults.filter((r) => r.status === "exists").length,
      orphanedVideos: orphanedVideos.length,
      results: checkResults,
      orphanedList: orphanedVideos,
    });
  } catch (error) {
    console.error(`❌ S3 sync check error:`, error.message);
    res.status(500).json({
      success: false,
      error: "Failed to check S3 sync",
      details: error.message,
    });
  }
});

router.get("/s3-bucket-info", async (req, res) => {
  try {
    // List objects in bucket
    const listParams = {
      Bucket: BUCKET_NAME,
      Prefix: "videos/",
      MaxKeys: 1000,
    };

    const r2Objects = await r2.listObjectsV2(listParams).promise();

    // Calculate total size
    const totalSize = r2Objects.Contents.reduce(
      (sum, obj) => sum + obj.Size,
      0
    );

    res.json({
      success: true,
      storage: "cloudflare-r2",
      bucketName: BUCKET_NAME,
      publicUrl: PUBLIC_R2_URL,
      totalObjects: r2Objects.KeyCount,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
      objects: r2Objects.Contents
        ? r2Objects.Contents.map((obj) => ({
            key: obj.Key,
            size: obj.Size,
            sizeMB: (obj.Size / (1024 * 1024)).toFixed(2),
            lastModified: obj.LastModified,
            publicUrl: getPublicUrl(obj.Key),
          }))
        : [],
    });
  } catch (error) {
    console.error(`❌ S3 bucket info error:`, error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get S3 bucket info",
      details: error.message,
    });
  }
});

export default router;
