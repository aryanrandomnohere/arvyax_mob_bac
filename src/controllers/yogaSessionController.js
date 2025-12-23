const YogaSession = require("../models/YogaSession");
const AWS = require("aws-sdk");
const config = require("../config/constants");

/**
 * Yoga Session Controller
 * Handles all operations for wellness session JSONs (Start Session feature)
 * Each session contains the flow, poses, timing for a complete practice
 */

// Cloudflare R2 Configuration
const r2 = new AWS.S3({
  accessKeyId: config.R2_ACCESS_KEY_ID,
  secretAccessKey: config.R2_SECRET_ACCESS_KEY,
  region: "auto",
  endpoint: config.R2_ENDPOINT,
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

const BUCKET_NAME = config.R2_BUCKET_NAME;
const PUBLIC_R2_URL = config.R2_PUBLIC_URL;

// Helper function to upload JSON to R2
const uploadToR2 = async (
  fileBuffer,
  fileName,
  mimeType,
  folder = "yogaSessions",
  subFolder = ""
) => {
  const key = subFolder
    ? `${folder}/${subFolder}/${fileName}`
    : `${folder}/${fileName}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: "public-read",
  };

  const result = await r2.upload(params).promise();
  return {
    key: key,
    url: `${PUBLIC_R2_URL}/${key}`,
    etag: result.ETag,
  };
};

// Helper function to delete file from R2
const deleteFromR2 = async (key) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  await r2.deleteObject(params).promise();
  return true;
};

/**
 * Get all yoga sessions
 * Returns list of all available session JSONs
 */
exports.getAllYogaSessions = async (req, res) => {
  try {
    const yogaSessions = await YogaSession.find().sort({ createdAt: -1 });
    console.log(`Retrieved ${yogaSessions.length} yoga sessions from database`);
    res.json(yogaSessions);
  } catch (error) {
    console.error("Error fetching yoga sessions:", error);
    res.status(500).json({
      error: "Failed to fetch yoga sessions",
      details: error.message,
    });
  }
};

/**
 * Get yoga sessions by section (e.g., Asana, Meditation)
 * Filters sessions based on section ID
 */
exports.getYogaSessionsBySection = async (req, res) => {
  try {
    const yogaSessions = await YogaSession.find({
      sectionId: req.params.sectionId,
    }).sort({ createdAt: -1 });
    console.log(
      `Retrieved ${yogaSessions.length} yoga sessions for section ${req.params.sectionId}`
    );
    res.json(yogaSessions);
  } catch (error) {
    console.error("Error fetching yoga sessions by section:", error);
    res.status(500).json({
      error: "Failed to fetch yoga sessions by section",
      details: error.message,
    });
  }
};

/**
 * Upload yoga session JSON file
 * Stores session data in R2 and creates database entry
 */
exports.uploadYogaSession = async (req, res) => {
  try {
    const { title, sectionId, uniqueId, cardId } = req.body;
    const jsonFile = req.file;

    if (!title || !sectionId || !uniqueId || !cardId) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Title, sectionId, uniqueId, and cardId are required",
      });
    }

    if (!jsonFile) {
      return res.status(400).json({
        error: "Missing JSON file",
        details: "JSON file is required",
      });
    }

    console.log("\n=== Starting Yoga Session JSON Upload to R2 ===");
    console.log("Title:", title);
    console.log("Section ID:", sectionId);
    console.log("Unique ID:", uniqueId);
    console.log("Card ID:", cardId);

    const fileName = `${uniqueId}.json`;

    const jsonUpload = await uploadToR2(
      jsonFile.buffer,
      fileName,
      jsonFile.mimetype || "application/json",
      "yogaSessions",
      sectionId
    );

    const yogaSession = await YogaSession.create({
      title,
      sectionId,
      uniqueId,
      cardId,
      url: jsonUpload.url,
      r2Key: jsonUpload.key,
      fileSize: jsonFile.size,
      mimeType: jsonFile.mimetype || "application/json",
    });

    console.log("=== Yoga Session JSON Successfully Stored in R2 ===\n");

    res.status(201).json({
      success: true,
      yogaSession,
    });
  } catch (error) {
    console.error("Error uploading yoga session:", error);
    res.status(500).json({
      error: "Failed to upload yoga session",
      details: error.message,
    });
  }
};

/**
 * Upload yoga session via URL (legacy support)
 * For direct URL-based saves
 */
exports.uploadYogaSessionUrl = async (req, res) => {
  try {
    const { title, sectionId, uniqueId, cardId, url, r2Key, fileSize } =
      req.body;

    if (!title || !sectionId || !uniqueId || !cardId || !url || !r2Key) {
      return res.status(400).json({
        error: "Missing required fields",
        details:
          "Title, sectionId, uniqueId, cardId, URL, and r2Key are required",
      });
    }

    const yogaSession = await YogaSession.create({
      title,
      sectionId,
      uniqueId,
      cardId,
      url,
      r2Key,
      fileSize: fileSize || 0,
      mimeType: "application/json",
    });

    res.status(201).json({
      success: true,
      yogaSession,
    });
  } catch (error) {
    console.error("Error uploading yoga session:", error);
    res.status(500).json({
      error: "Failed to upload yoga session",
      details: error.message,
    });
  }
};

/**
 * Delete yoga session
 * Removes session from both R2 and database
 */
exports.deleteYogaSession = async (req, res) => {
  try {
    const yogaSession = await YogaSession.findById(req.params.id);
    if (!yogaSession) {
      return res.status(404).json({ error: "Yoga session not found" });
    }

    console.log("\n=== Starting Yoga Session Deletion ===");

    let deletionErrors = [];

    if (
      yogaSession.r2Key &&
      yogaSession.r2Key !== "undefined" &&
      yogaSession.r2Key !== "null"
    ) {
      try {
        await deleteFromR2(yogaSession.r2Key);
        console.log("✅ JSON deleted from R2 successfully");
      } catch (error) {
        console.error("❌ JSON R2 deletion failed:", error.message);
        deletionErrors.push(`JSON deletion error: ${error.message}`);
      }
    }

    await YogaSession.findByIdAndDelete(req.params.id);
    console.log("✅ Yoga session deleted from database");

    res.json({
      success: true,
      message: "Yoga session deleted successfully",
      warnings: deletionErrors.length > 0 ? deletionErrors : undefined,
    });
  } catch (error) {
    console.error("❌ Error deleting yoga session:", error);
    res.status(500).json({
      error: "Failed to delete yoga session",
      details: error.message,
    });
  }
};

/**
 * Force delete yoga session
 * Deletes from database even if R2 deletion fails
 */
exports.forceDeleteYogaSession = async (req, res) => {
  try {
    const yogaSession = await YogaSession.findById(req.params.id);
    if (!yogaSession) {
      return res.status(404).json({ error: "Yoga session not found" });
    }

    console.log("\n=== Force Delete Yoga Session ===");

    try {
      await deleteFromR2(yogaSession.r2Key);
    } catch (error) {
      console.log("R2 deletion failed, continuing with database deletion");
    }

    await YogaSession.findByIdAndDelete(req.params.id);
    console.log("✅ Yoga session force deleted from database");

    res.json({
      success: true,
      message: "Yoga session force deleted successfully",
    });
  } catch (error) {
    console.error("Error force deleting yoga session:", error);
    res.status(500).json({
      error: "Failed to force delete yoga session",
      details: error.message,
    });
  }
};

/**
 * Update yoga session metadata
 * Updates title, section, or card IDs
 */
exports.updateYogaSession = async (req, res) => {
  try {
    const { title, sectionId, uniqueId, cardId } = req.body;

    if (!title) {
      return res.status(400).json({
        error: "Title is required",
      });
    }

    const updateData = { title };
    if (sectionId) updateData.sectionId = sectionId;
    if (uniqueId) updateData.uniqueId = uniqueId;
    if (cardId) updateData.cardId = cardId;

    const yogaSession = await YogaSession.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!yogaSession) {
      return res.status(404).json({ error: "Yoga session not found" });
    }

    res.json({
      success: true,
      yogaSession,
    });
  } catch (error) {
    console.error("Error updating yoga session:", error);
    res.status(500).json({
      error: "Failed to update yoga session",
      details: error.message,
    });
  }
};

/**
 * Get yoga session info by ID
 * Returns detailed session information
 */
exports.getYogaSessionInfo = async (req, res) => {
  try {
    const yogaSession = await YogaSession.findById(req.params.id);
    if (!yogaSession) {
      return res.status(404).json({ error: "Yoga session not found" });
    }

    res.json({
      success: true,
      yogaSession,
    });
  } catch (error) {
    console.error("Error fetching yoga session info:", error);
    res.status(500).json({
      error: "Failed to fetch yoga session info",
      details: error.message,
    });
  }
};

/**
 * Test R2 connection
 * Validates cloud storage connectivity
 */
exports.testR2Connection = async (req, res) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      MaxKeys: 1,
    };

    const result = await r2.listObjectsV2(params).promise();

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
