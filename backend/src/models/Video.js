const mongoose = require('mongoose');

const VIDEO_STATUSES = ['uploaded', 'processing', 'completed', 'failed'];
const SENSITIVITY_STATUSES = ['pending', 'safe', 'flagged'];

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    // Users allowed to view/stream this video (required for viewer role)
    allowedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
    filePath: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      trim: true,
    },
    mimeType: {
      type: String,
      trim: true,
    },
    // If we transcode, this points to the prepared streaming file
    preparedFilePath: {
      type: String,
      trim: true,
    },
    // Metadata extracted via ffprobe (optional)
    durationSeconds: {
      type: Number,
      min: 0,
    },
    width: {
      type: Number,
      min: 0,
    },
    height: {
      type: Number,
      min: 0,
    },
    codec: {
      type: String,
      trim: true,
    },
    containerFormat: {
      type: String,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: VIDEO_STATUSES,
      default: 'uploaded',
    },
    sensitivityStatus: {
      type: String,
      enum: SENSITIVITY_STATUSES,
      default: 'pending',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Compression info
    compressedFilePath: {
      type: String,
      trim: true,
    },
    compressedSize: {
      type: Number,
      min: 0,
    },
    compressionQuality: {
      type: String,
      enum: ['low', 'medium', 'high'],
      trim: true,
    },
    isCompressing: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Video = mongoose.model('Video', videoSchema);

module.exports = {
  Video,
  VIDEO_STATUSES,
  SENSITIVITY_STATUSES,
};

