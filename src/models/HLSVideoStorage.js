import mongoose from "mongoose";

/**
 * HLS Video Storage Schema
 * Stores metadata for HLS-formatted videos with adaptive bitrate streaming
 * HLS (HTTP Live Streaming) breaks videos into segments for efficient streaming
 */
const HLSVideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
    // HLS-specific URLs
    url: {
      type: String,
      required: true, // HLS playlist URL (playlist.m3u8)
    },
    originalUrl: {
      type: String,
      required: true, // Original video URL (before HLS conversion)
    },
    // S3/R2 Keys
    s3Key: {
      type: String,
      required: true, // HLS playlist key in R2
    },
    originalS3Key: {
      type: String,
      required: true, // Original video key in R2
    },
    s3Bucket: {
      type: String,
      required: true,
    },
    // File information
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    // HLS-specific fields
    isHLS: {
      type: Boolean,
      default: true, // Always true for this schema
    },
    hlsKeys: [
      {
        type: String, // Array of all HLS file keys (playlist + segments)
      },
    ],
    hlsSegments: {
      type: Number,
      default: 0, // Number of .ts segments
    },
    // Video metadata
    videoInfo: {
      duration: Number, // in seconds
      size: Number, // file size in bytes
      bitrate: Number, // bitrate
      video: {
        codec: String,
        width: Number,
        height: Number,
        framerate: String,
      },
      audio: {
        codec: String,
        sampleRate: Number,
        channels: Number,
      },
    },
    // Processing information
    uploadStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    processingTime: {
      type: Date,
      default: Date.now,
    },
    // Storage provider
    storageProvider: {
      type: String,
      enum: ["cloudflare-r2", "aws-s3", "google-cloud"],
      default: "cloudflare-r2",
    },
    // Analytics fields
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    // User information (if you have user system)
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Indexes for better performance
HLSVideoSchema.index({ title: "text", description: "text" }); // Text search
HLSVideoSchema.index({ tags: 1 }); // Tag search
HLSVideoSchema.index({ isPublic: 1 }); // Public/private filter
HLSVideoSchema.index({ createdAt: -1 }); // Sort by creation date
HLSVideoSchema.index({ uploadStatus: 1 }); // Filter by status
HLSVideoSchema.index({ storageProvider: 1 }); // Filter by provider

// Virtual for formatted file size
HLSVideoSchema.virtual("fileSizeFormatted").get(function () {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (this.fileSize === 0) return "0 Bytes";
  const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
  return (
    Math.round((this.fileSize / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  );
});

// Virtual for formatted duration
HLSVideoSchema.virtual("durationFormatted").get(function () {
  if (!this.videoInfo || !this.videoInfo.duration) return "0:00";
  const duration = Math.floor(this.videoInfo.duration);
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
});

// Virtual for resolution string
HLSVideoSchema.virtual("resolution").get(function () {
  if (!this.videoInfo || !this.videoInfo.video) return "Unknown";
  return `${this.videoInfo.video.width}x${this.videoInfo.video.height}`;
});

// Pre-save middleware to update the updatedAt field
HLSVideoSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Pre-update middleware to update the updatedAt field
HLSVideoSchema.pre(["updateOne", "findOneAndUpdate"], function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Instance method to increment views
HLSVideoSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Instance method to increment likes
HLSVideoSchema.methods.incrementLikes = function () {
  this.likes += 1;
  return this.save();
};

// Instance method to increment downloads
HLSVideoSchema.methods.incrementDownloads = function () {
  this.downloads += 1;
  return this.save();
};

// Static method to find public videos
HLSVideoSchema.statics.findPublic = function () {
  return this.find({ isPublic: true, uploadStatus: "completed" });
};

// Static method to find by tags
HLSVideoSchema.statics.findByTags = function (tags) {
  return this.find({ tags: { $in: tags }, uploadStatus: "completed" });
};

// Static method to get video statistics
HLSVideoSchema.statics.getStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalSize: { $sum: "$fileSize" },
        totalSegments: { $sum: "$hlsSegments" },
        totalDuration: { $sum: "$videoInfo.duration" },
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: "$likes" },
        totalDownloads: { $sum: "$downloads" },
        avgSegmentsPerVideo: { $avg: "$hlsSegments" },
      },
    },
  ]);
};

const HLSVideoStorage = mongoose.model("hls_video_storage", HLSVideoSchema);

export default HLSVideoStorage;
