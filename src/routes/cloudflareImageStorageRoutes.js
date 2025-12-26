import express from "express";
import AWS from "aws-sdk";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_ENDPOINT,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
} from "../config/constants.js";

/**
 * Cloudflare R2 Image Storage Routes
 * Manages image uploads, downloads, deletion, and metadata for the wellness platform
 * Uses Cloudflare R2 (S3-compatible) for scalable, cost-effective image storage
 *
 * Features:
 * - Single and bulk image uploads with metadata
 * - Image deletion with retry logic
 * - Image listing and searching
 * - Storage statistics and analytics
 * - Public URL generation for image access
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

// Configure multer for memory storage (files stay in RAM, not disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
  },
  fileFilter: (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
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
 * POST /api/images/upload-image
 * Upload a single image to Cloudflare R2
 *
 * Body: multipart/form-data
 * - image (required): Image file
 * - title (required): Image title/name
 * - description (optional): Image description
 * - category (optional): Image category (e.g., "yoga-poses", "meditation", "general")
 * - altText (optional): Alt text for accessibility
 * - tags (optional): Comma-separated tags
 * - isPublic (optional): Whether image is publicly accessible (default: true)
 *
 * Returns: Image metadata with public URL
 */
const uploadImageHandler = async (req, res) => {
  try {
    const {
      title,
      description = "",
      tags = [],
      isPublic = true,
      category = "general",
      altText = "",
    } = req.body;
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
        details: "Image file is required",
      });
    }

    // Generate unique filename with UUID to avoid conflicts
    const fileExtension = file.originalname.split(".").pop();
    const r2Key = `yoga_poses_images/${uuidv4()}.${fileExtension}`;

    console.log("\n=== Starting Cloudflare R2 Image Upload ===");
    console.log("Title:", title);
    console.log("Original filename:", file.originalname);
    console.log("File size:", (file.size / (1024 * 1024)).toFixed(2), "MB");
    console.log("R2 Key:", r2Key);
    console.log("Category:", category);
    console.log("==========================================\n");

    // Upload to Cloudflare R2 with metadata
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        "original-name": file.originalname,
        "uploaded-by": "image-management-system",
        title: title,
        category: category,
        "upload-timestamp": new Date().toISOString(),
      },
    };

    const r2Result = await r2.upload(uploadParams).promise();

    console.log("✅ Cloudflare R2 Image Upload successful:", r2Result.Location);

    // Generate public URL
    const publicUrl = getPublicUrl(r2Key);

    // Parse tags if provided as comma-separated string
    const parsedTags =
      typeof tags === "string"
        ? tags.split(",").map((tag) => tag.trim())
        : tags;

    // Create response object
    const imageData = {
      title,
      description,
      altText,
      tags: parsedTags,
      category,
      isPublic: isPublic === "true" || isPublic === true,
      url: publicUrl,
      r2Key: r2Key,
      r2Bucket: BUCKET_NAME,
      fileSize: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
      uploadStatus: "completed",
      uploadedAt: new Date().toISOString(),
    };

    console.log("\n=== Image Successfully Stored in Cloudflare R2 ===");
    console.log("Title:", imageData.title);
    console.log("Public URL:", imageData.url);
    console.log("R2 Key:", imageData.r2Key);
    console.log(
      "File Size:",
      (imageData.fileSize / (1024 * 1024)).toFixed(2),
      "MB"
    );
    console.log("Category:", imageData.category);
    console.log("Tags:", imageData.tags);
    console.log("Public:", imageData.isPublic);
    console.log("================================================\n");

    res.status(201).json({
      success: true,
      image: imageData,
      storage: "cloudflare-r2",
      message: "Image uploaded successfully to Cloudflare R2",
    });
  } catch (error) {
    console.error("Error uploading image to Cloudflare R2:", error);
    res.status(500).json({
      error: "Failed to upload image to Cloudflare R2",
      details: error.message,
    });
  }
};

// Register routes with handlers
router.post("/upload-image", upload.single("image"), uploadImageHandler);
router.post("/upload-r2-image", upload.single("image"), uploadImageHandler); // Legacy alias

/**
 * POST /api/images/upload-images
 * Upload multiple images to Cloudflare R2 in bulk
 *
 * Body: multipart/form-data
 * - images (required): Up to 10 image files
 * - titles (optional): Array of titles for each image
 * - descriptions (optional): Array of descriptions
 * - category (optional): Category for all images
 * - altTexts (optional): Array of alt texts
 * - tags (optional): Comma-separated tags for all images
 * - isPublic (optional): Whether all images are public (default: true)
 *
 * Returns: Array of uploaded images with URLs and error list for failed uploads
 */
const uploadImagesHandler = async (req, res) => {
  try {
    const {
      titles,
      descriptions = [],
      tags = [],
      isPublic = true,
      category = "general",
      altTexts = [],
    } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: "No image files provided",
      });
    }

    console.log(`\n=== Starting Bulk Upload of ${files.length} Images ===`);

    // Upload all files in parallel
    const uploadPromises = files.map(async (file, index) => {
      try {
        const fileExtension = file.originalname.split(".").pop();
        const r2Key = `yoga_poses_images/${uuidv4()}.${fileExtension}`;

        const uploadParams = {
          Bucket: BUCKET_NAME,
          Key: r2Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            "original-name": file.originalname,
            "uploaded-by": "image-management-system",
            title: titles ? titles[index] : `Image ${index + 1}`,
            category: category,
            "upload-timestamp": new Date().toISOString(),
          },
        };

        const r2Result = await r2.upload(uploadParams).promise();
        const publicUrl = getPublicUrl(r2Key);

        return {
          success: true,
          title: titles ? titles[index] : `Image ${index + 1}`,
          description: descriptions[index] || "",
          altText: altTexts[index] || "",
          tags:
            typeof tags === "string"
              ? tags.split(",").map((tag) => tag.trim())
              : tags,
          category,
          isPublic: isPublic === "true" || isPublic === true,
          url: publicUrl,
          r2Key: r2Key,
          r2Bucket: BUCKET_NAME,
          fileSize: file.size,
          mimeType: file.mimetype,
          originalName: file.originalname,
          uploadStatus: "completed",
          uploadedAt: new Date().toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          originalName: file.originalname,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log(
      `✅ Bulk upload completed: ${successful.length} successful, ${failed.length} failed`
    );

    res.status(201).json({
      success: true,
      message: `Uploaded ${successful.length} images successfully`,
      totalUploaded: successful.length,
      totalFailed: failed.length,
      images: successful,
      failures: failed,
      storage: "cloudflare-r2",
    });
  } catch (error) {
    console.error("Error in bulk image upload:", error);
    res.status(500).json({
      error: "Failed to upload images to Cloudflare R2",
      details: error.message,
    });
  }
};

// Register routes with handlers
router.post("/upload-images", upload.array("images", 10), uploadImagesHandler);
router.post(
  "/upload-r2-images",
  upload.array("images", 10),
  uploadImagesHandler
); // Legacy alias

/**
 * POST /api/images/save-image-url
 * Save image metadata via URL (for images already uploaded to R2)
 *
 * Body: JSON
 * - title (required): Image title
 * - url (required): Public URL
 * - r2Key (required): R2 storage key
 * - description (optional): Image description
 * - category (optional): Image category
 * - altText (optional): Alt text
 * - tags (optional): Comma-separated tags
 * - isPublic (optional): Public accessibility flag
 *
 * Returns: Image metadata object
 */
const saveImageUrlHandler = async (req, res) => {
  try {
    let {
      title,
      url,
      r2Key,
      description = "",
      tags = [],
      isPublic = true,
      category = "general",
      altText = "",
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

    const imageData = {
      title,
      description,
      altText,
      tags: parsedTags,
      category,
      isPublic: isPublic === "true" || isPublic === true,
      url,
      r2Key: r2Key,
      r2Bucket: BUCKET_NAME,
      uploadStatus: "completed",
      uploadedAt: new Date().toISOString(),
    };

    console.log("\n=== Image URL Successfully Stored (R2) ===");
    console.log("Title:", imageData.title);
    console.log("Public URL:", imageData.url);
    console.log("R2 Key:", imageData.r2Key);
    console.log("Category:", imageData.category);
    console.log("======================================\n");

    res.status(201).json({
      success: true,
      image: imageData,
      storage: "cloudflare-r2",
      message: "Image URL saved successfully",
    });
  } catch (error) {
    console.error("Error saving R2 image URL:", error);
    res.status(500).json({
      error: "Failed to save R2 image URL",
      details: error.message,
    });
  }
};

// Register routes with handlers
router.post("/save-image-url", saveImageUrlHandler);
router.post("/upload-r2-image-url", saveImageUrlHandler); // Legacy alias

/**
 * DELETE /api/images/delete-image/:r2Key
 * Delete an image from Cloudflare R2 with retry logic
 *
 * Params:
 * - r2Key (required): The R2 storage key/path to delete
 *
 * Returns: Success/failure status
 */
const deleteImageHandler = async (req, res) => {
  const r2Key = req.params.r2Key;

  try {
    console.log(`\n🗑️  Starting R2 image deletion for: ${r2Key}`);

    // Try R2 deletion with retries (handles temporary failures)
    const r2Result = await retryR2Delete(r2Key);

    if (r2Result.success) {
      console.log(`✅ Image deletion: SUCCESS`);

      res.json({
        success: true,
        message: "Image deleted successfully from Cloudflare R2",
        r2Key: r2Key,
        storage: "cloudflare-r2",
      });
    } else {
      console.log(`❌ Image deletion: FAILED`);

      res.status(500).json({
        success: false,
        error: "Failed to delete image from R2",
        r2Key: r2Key,
        details: r2Result.error,
        storage: "cloudflare-r2",
      });
    }
  } catch (error) {
    console.error(`❌ Delete error for R2 image ${r2Key}:`, error.message);
    res.status(500).json({
      success: false,
      error: "Failed to delete R2 image",
      details: error.message,
    });
  }
};

// Register routes with handlers
router.delete("/delete-image/:r2Key(*)", deleteImageHandler);
router.delete("/delete-r2-image/:r2Key(*)", deleteImageHandler); // Legacy alias

/**
 * GET /api/images/list
 * Get list of all images from R2 bucket with pagination and sorting
 *
 * Query params:
 * - prefix (optional): R2 folder prefix (default: "yoga_poses_images/")
 * - limit (optional): Maximum images to return (default: 100)
 * - sortBy (optional): Sort field - "LastModified" or "size" (default: "LastModified")
 * - sortOrder (optional): Sort direction - "asc" or "desc" (default: "desc")
 *
 * Returns: Array of images with metadata and storage stats
 */
const listImagesHandler = async (req, res) => {
  try {
    const {
      prefix = "yoga_poses_images/",
      limit = 100,
      sortBy = "LastModified",
      sortOrder = "desc",
    } = req.query;

    const listParams = {
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: parseInt(limit),
    };

    const r2Objects = await r2.listObjectsV2(listParams).promise();

    let images = r2Objects.Contents
      ? r2Objects.Contents.map((obj) => {
          const publicUrl = getPublicUrl(obj.Key);
          return {
            r2Key: obj.Key,
            url: publicUrl,
            size: obj.Size,
            sizeMB: (obj.Size / (1024 * 1024)).toFixed(2),
            lastModified: obj.LastModified,
            fileName: obj.Key.split("/").pop(),
          };
        })
      : [];

    // Sort images based on query parameter
    images.sort((a, b) => {
      if (sortBy === "LastModified") {
        return sortOrder === "desc"
          ? new Date(b.lastModified) - new Date(a.lastModified)
          : new Date(a.lastModified) - new Date(b.lastModified);
      } else if (sortBy === "size") {
        return sortOrder === "desc" ? b.size - a.size : a.size - b.size;
      }
      return 0;
    });

    // Calculate total size
    const totalSize = images.reduce((sum, img) => sum + img.size, 0);

    console.log(`📸 Retrieved ${images.length} images from R2 bucket`);

    res.json({
      success: true,
      storage: "cloudflare-r2",
      totalImages: images.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
      images: images,
    });
  } catch (error) {
    console.error("Error fetching R2 images:", error);
    res.status(500).json({
      error: "Failed to fetch R2 images",
      details: error.message,
    });
  }
};

// Register routes with handlers
router.get("/list", listImagesHandler);
router.get("/get-r2-images", listImagesHandler); // Legacy alias

/**
 * GET /api/images/info
 * Get detailed bucket information for yoga poses images
 * Includes total size, file type distribution, and recent uploads
 *
 * Returns: Bucket stats, file type breakdown, and recent images
 */
const getImageInfoHandler = async (req, res) => {
  try {
    // List objects in images folder
    const listParams = {
      Bucket: BUCKET_NAME,
      Prefix: "yoga_poses_images/",
      MaxKeys: 1000,
    };

    const r2Objects = await r2.listObjectsV2(listParams).promise();

    // Calculate total size
    const totalSize = r2Objects.Contents.reduce(
      (sum, obj) => sum + obj.Size,
      0
    );

    // Group by file type extension
    const fileTypes = {};
    r2Objects.Contents.forEach((obj) => {
      const extension = obj.Key.split(".").pop().toLowerCase();
      if (!fileTypes[extension]) {
        fileTypes[extension] = { count: 0, size: 0 };
      }
      fileTypes[extension].count++;
      fileTypes[extension].size += obj.Size;
    });

    res.json({
      success: true,
      storage: "cloudflare-r2",
      bucketName: BUCKET_NAME,
      publicUrl: PUBLIC_R2_URL,
      folder: "yoga_poses_images",
      totalImages: r2Objects.KeyCount,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
      fileTypes: fileTypes,
      images: r2Objects.Contents
        ? r2Objects.Contents.map((obj) => ({
            key: obj.Key,
            size: obj.Size,
            sizeMB: (obj.Size / (1024 * 1024)).toFixed(2),
            lastModified: obj.LastModified,
            publicUrl: getPublicUrl(obj.Key),
            fileName: obj.Key.split("/").pop(),
          }))
        : [],
    });
  } catch (error) {
    console.error(`❌ R2 images info error:`, error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get R2 images info",
      details: error.message,
    });
  }
};

// Register routes with handlers
router.get("/info", getImageInfoHandler);
router.get("/r2-images-info", getImageInfoHandler); // Legacy alias

/**
 * GET /api/images/search
 * Search images by filename or metadata with filters
 *
 * Query params:
 * - q (optional): Search query (filename search)
 * - fileType (optional): Filter by file extension (e.g., "jpg", "png")
 * - minSize (optional): Minimum file size in bytes
 * - maxSize (optional): Maximum file size in bytes
 * - limit (optional): Maximum results to return (default: 50)
 *
 * Returns: Filtered array of matching images
 */
const searchImagesHandler = async (req, res) => {
  try {
    const { q, fileType, minSize, maxSize, limit = 50 } = req.query;

    const listParams = {
      Bucket: BUCKET_NAME,
      Prefix: "yoga_poses_images/",
      MaxKeys: parseInt(limit) * 2, // Get more to filter
    };

    const r2Objects = await r2.listObjectsV2(listParams).promise();

    let images = r2Objects.Contents
      ? r2Objects.Contents.map((obj) => {
          const publicUrl = getPublicUrl(obj.Key);
          const fileName = obj.Key.split("/").pop();
          const fileExtension = fileName.split(".").pop().toLowerCase();

          return {
            r2Key: obj.Key,
            url: publicUrl,
            fileName: fileName,
            fileExtension: fileExtension,
            size: obj.Size,
            sizeMB: (obj.Size / (1024 * 1024)).toFixed(2),
            lastModified: obj.LastModified,
          };
        })
      : [];

    // Apply search and filter criteria
    if (q) {
      images = images.filter((img) =>
        img.fileName.toLowerCase().includes(q.toLowerCase())
      );
    }

    if (fileType) {
      images = images.filter(
        (img) => img.fileExtension === fileType.toLowerCase()
      );
    }

    if (minSize) {
      images = images.filter((img) => img.size >= parseInt(minSize));
    }

    if (maxSize) {
      images = images.filter((img) => img.size <= parseInt(maxSize));
    }

    // Limit results
    images = images.slice(0, parseInt(limit));

    res.json({
      success: true,
      storage: "cloudflare-r2",
      totalFound: images.length,
      searchQuery: { q, fileType, minSize, maxSize },
      images: images,
    });
  } catch (error) {
    console.error(`❌ R2 image search error:`, error.message);
    res.status(500).json({
      success: false,
      error: "Failed to search R2 images",
      details: error.message,
    });
  }
};

// Register routes with handlers
router.get("/search", searchImagesHandler);
router.get("/search-r2-images", searchImagesHandler); // Legacy alias

/**
 * GET /api/images/stats
 * Get comprehensive image storage statistics
 * Includes total counts, sizes, distributions, and recent uploads
 *
 * Returns: Detailed stats including file type distribution and recent images
 */
const getImageStatsHandler = async (req, res) => {
  try {
    const listParams = {
      Bucket: BUCKET_NAME,
      Prefix: "yoga_poses_images/",
      MaxKeys: 1000,
    };

    const r2Objects = await r2.listObjectsV2(listParams).promise();

    if (!r2Objects.Contents || r2Objects.Contents.length === 0) {
      return res.json({
        success: true,
        storage: "cloudflare-r2",
        totalImages: 0,
        totalSize: 0,
        stats: {
          totalImages: 0,
          totalSizeMB: 0,
          totalSizeGB: 0,
          avgSizeMB: 0,
          largestImageMB: 0,
          smallestImageMB: 0,
        },
      });
    }

    const sizes = r2Objects.Contents.map((obj) => obj.Size);
    const totalSize = sizes.reduce((sum, size) => sum + size, 0);
    const avgSize = totalSize / sizes.length;

    // File type distribution
    const fileTypes = {};
    r2Objects.Contents.forEach((obj) => {
      const extension = obj.Key.split(".").pop().toLowerCase();
      fileTypes[extension] = (fileTypes[extension] || 0) + 1;
    });

    res.json({
      success: true,
      storage: "cloudflare-r2",
      folder: "yoga_poses_images",
      stats: {
        totalImages: r2Objects.Contents.length,
        totalSize: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
        avgSizeMB: (avgSize / (1024 * 1024)).toFixed(2),
        largestImageMB: (Math.max(...sizes) / (1024 * 1024)).toFixed(2),
        smallestImageMB: (Math.min(...sizes) / (1024 * 1024)).toFixed(2),
      },
      fileTypeDistribution: fileTypes,
      recentImages: r2Objects.Contents.sort(
        (a, b) => new Date(b.LastModified) - new Date(a.LastModified)
      )
        .slice(0, 5)
        .map((obj) => ({
          fileName: obj.Key.split("/").pop(),
          sizeMB: (obj.Size / (1024 * 1024)).toFixed(2),
          lastModified: obj.LastModified,
          url: getPublicUrl(obj.Key),
        })),
    });
  } catch (error) {
    console.error(`❌ R2 image stats error:`, error.message);
    res.status(500).json({
      success: false,
      error: "Failed to get R2 image statistics",
      details: error.message,
    });
  }
};

// Register routes with handlers
router.get("/stats", getImageStatsHandler);
router.get("/r2-image-stats", getImageStatsHandler); // Legacy alias

export default router;
