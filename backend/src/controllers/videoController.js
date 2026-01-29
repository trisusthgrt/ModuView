const fs = require('fs');
const path = require('path');
const { Video } = require('../models/Video');
const { processVideo } = require('../services/processing.service');
const { User } = require('../models/User');
const { compressVideo } = require('../services/ffmpeg.service');

// Get io instance from app (will be set by server.js)
let ioInstance = null;

const setIOInstance = (io) => {
  ioInstance = io;
};

// POST /videos - Upload video
const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const { title, description } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenantId;

    const video = await Video.create({
      title: title || req.file.originalname,
      description: description || '',
      ownerId: userId,
      tenantId,
      allowedUsers: [userId],
      filePath: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: 'uploaded',
      sensitivityStatus: 'pending',
      progress: 0,
    });

    // Start processing in background (non-blocking)
    if (ioInstance) {
      processVideo(video._id, ioInstance).catch((err) => {
        console.error(`Processing error for video ${video._id}:`, err);
        // Update video status to failed
        Video.findByIdAndUpdate(video._id, { status: 'failed' }).catch(
          console.error
        );
      });
    }

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        id: video._id,
        title: video.title,
        status: video.status,
        sensitivityStatus: video.sensitivityStatus,
        progress: video.progress,
        durationSeconds: video.durationSeconds,
        size: video.size,
        createdAt: video.createdAt,
      },
    });
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
};

// GET /videos - List videos with filters
const listVideos = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, sensitivityStatus, from, to, minSize, maxSize } = req.query;

    const query = { tenantId };
    // Viewers can see all videos in their tenant (same as editors/admins)
    // The allowedUsers field is still used for explicit sharing/restrictions if needed

    if (status) {
      query.status = status;
    }

    if (sensitivityStatus) {
      query.sensitivityStatus = sensitivityStatus;
    }

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    if (minSize || maxSize) {
      query.size = {};
      if (minSize) query.size.$gte = parseInt(minSize);
      if (maxSize) query.size.$lte = parseInt(maxSize);
    }

    const videos = await Video.find(query)
      .select('-filePath') // Don't expose file paths
      .populate('ownerId', 'email')
      .sort({ createdAt: -1 });

    res.json({
      videos: videos.map((v) => ({
        id: v._id,
        title: v.title,
        description: v.description,
        owner: v.ownerId?.email || 'Unknown',
        status: v.status,
        sensitivityStatus: v.sensitivityStatus,
        progress: v.progress ?? 0,
        durationSeconds: v.durationSeconds,
        width: v.width,
        height: v.height,
        size: v.size,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /videos/:id - Get video details
const getVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const video = await Video.findOne({ _id: id, tenantId }).populate('ownerId', 'email');

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json({
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        owner: video.ownerId?.email || 'Unknown',
        status: video.status,
        sensitivityStatus: video.sensitivityStatus,
        progress: video.progress ?? 0,
        durationSeconds: video.durationSeconds,
        width: video.width,
        height: video.height,
        codec: video.codec,
        containerFormat: video.containerFormat,
        size: video.size,
        compressedSize: video.compressedSize,
        compressionQuality: video.compressionQuality,
        isCompressing: video.isCompressing,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /videos/:id - Update video metadata (Editor/Admin only)
const updateVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { title, description } = req.body;

    const video = await Video.findOne({ _id: id, tenantId });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (title !== undefined) video.title = title;
    if (description !== undefined) video.description = description;

    await video.save();

    res.json({
      message: 'Video updated successfully',
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        status: video.status,
        sensitivityStatus: video.sensitivityStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /videos/:id - Delete video (Editor/Admin only)
const deleteVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const video = await Video.findOne({ _id: id, tenantId });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(video.filePath)) {
      fs.unlinkSync(video.filePath);
    }

    await Video.findByIdAndDelete(id);

    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// PATCH /videos/:id/permissions - Set assigned viewers (Editor/Admin only)
// Body: { allowedUserIds: string[] }
const setVideoPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { allowedUserIds } = req.body;

    if (!Array.isArray(allowedUserIds)) {
      return res
        .status(400)
        .json({ message: 'allowedUserIds must be an array of user IDs' });
    }

    const video = await Video.findOne({ _id: id, tenantId });
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Ensure all users exist and belong to same tenant
    const users = await User.find({
      _id: { $in: allowedUserIds },
      tenantId,
    }).select('_id');

    const validIds = users.map((u) => u._id.toString());

    // Always keep the owner assigned
    const ownerId = video.ownerId.toString();
    const merged = Array.from(new Set([ownerId, ...validIds]));

    video.allowedUsers = merged;
    await video.save();

    res.json({
      message: 'Video permissions updated',
      video: {
        id: video._id,
        allowedUsers: video.allowedUsers,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /videos/:id/compress - Compress video (Editor only)
// Body: { quality: 'low' | 'medium' | 'high' }
const compressVideoEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { quality = 'medium' } = req.body;

    if (!['low', 'medium', 'high'].includes(quality)) {
      return res.status(400).json({ message: 'Quality must be low, medium, or high' });
    }

    const video = await Video.findOne({ _id: id, tenantId });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (video.status !== 'completed') {
      return res.status(400).json({ message: 'Video must be completed before compression' });
    }

    if (video.isCompressing) {
      return res.status(400).json({ message: 'Compression already in progress' });
    }

    // Check if ffmpeg is available
    try {
      video.isCompressing = true;
      await video.save();

      const outputDir = path.dirname(video.filePath);
      const result = await compressVideo(video.filePath, outputDir, quality);

      // Update video with compressed file info
      video.compressedFilePath = result.outputPath;
      video.compressedSize = result.compressedSize;
      video.compressionQuality = quality;
      video.isCompressing = false;
      await video.save();

      // Emit compression complete event
      if (ioInstance) {
        ioInstance.to(`tenant:${tenantId}`).emit('video:compressed', {
          videoId: video._id.toString(),
          compressedSize: result.compressedSize,
          originalSize: result.originalSize,
          quality,
        });
      }

      res.json({
        message: 'Video compressed successfully',
        video: {
          id: video._id,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          compressionRatio: ((1 - result.compressedSize / result.originalSize) * 100).toFixed(1) + '%',
          quality,
        },
      });
    } catch (err) {
      video.isCompressing = false;
      await video.save();
      console.error('Compression error:', err);
      return res.status(500).json({
        message: 'Compression failed. Please try again.',
        error: err.message,
      });
    }
  } catch (err) {
    next(err);
  }
};

// GET /videos/:id/download - Download video (prefers compressed if available)
const downloadVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const video = await Video.findOne({ _id: id, tenantId });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (video.status !== 'completed') {
      return res.status(400).json({
        message: 'Video is not ready for download',
        status: video.status,
      });
    }

    // Prefer compressed version if available, otherwise original
    const filePath = video.compressedFilePath || video.filePath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Video file not found' });
    }

    const stat = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    // Clean filename for download (remove compression suffix if present)
    const downloadName = video.compressedFilePath
      ? `${video.title || 'video'}-compressed-${video.compressionQuality || 'medium'}.mp4`
      : `${video.title || 'video'}.mp4`;

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Length', stat.size);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadVideo,
  listVideos,
  getVideo,
  updateVideo,
  deleteVideo,
  setVideoPermissions,
  compressVideoEndpoint,
  downloadVideo,
  setIOInstance,
};
