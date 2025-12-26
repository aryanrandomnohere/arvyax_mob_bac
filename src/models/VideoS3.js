import mongoose from "mongoose";

/**
 * VideoS3 Model
 * Stores video metadata for videos uploaded to Cloudflare R2 storage
 * Used for video management in the wellness platform
 */

const VideoS3Schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
      unique: true,
    },
    s3Bucket: {
      type: String,
      required: true,
      default: "arvya-x-videos",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: "video/mp4",
    },
    originalName: {
      type: String,
      default: "",
    },
    uploadStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      default: "",
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    metadata: {
      width: Number,
      height: Number,
      format: String,
      bitRate: Number,
      frameRate: Number,
    },
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
    timestamps: true, // This will automatically manage createdAt and updatedAt
  }
);

// Create indexes for better performance
VideoS3Schema.index({ createdAt: -1 });
VideoS3Schema.index({ title: "text", description: "text" });
VideoS3Schema.index({ tags: 1 });
VideoS3Schema.index({ s3Key: 1 });
VideoS3Schema.index({ uploadStatus: 1 });

// Virtual for file size in MB
VideoS3Schema.virtual("fileSizeMB").get(function () {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Virtual for duration in minutes
VideoS3Schema.virtual("durationMinutes").get(function () {
  return (this.duration / 60).toFixed(2);
});

// Pre-save middleware to update the updatedAt field
VideoS3Schema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to increment view count
VideoS3Schema.methods.incrementViews = function () {
  this.viewCount += 1;
  return this.save();
};

// Static method to find videos by tag
VideoS3Schema.statics.findByTag = function (tag) {
  return this.find({ tags: { $in: [tag] } });
};

// Static method to find public videos
VideoS3Schema.statics.findPublic = function () {
  return this.find({ isPublic: true }).sort({ createdAt: -1 });
};

// Static method to get video statistics
VideoS3Schema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalSize: { $sum: "$fileSize" },
        totalViews: { $sum: "$viewCount" },
        avgFileSize: { $avg: "$fileSize" },
        avgDuration: { $avg: "$duration" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalVideos: 0,
      totalSize: 0,
      totalViews: 0,
      avgFileSize: 0,
      avgDuration: 0,
    }
  );
};

export default mongoose.model("VideoS3", VideoS3Schema);
