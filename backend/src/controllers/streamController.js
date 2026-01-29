const fs = require('fs');
const path = require('path');
const { Video } = require('../models/Video');

const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mpeg': 'video/mpeg',
    '.mpg': 'video/mpeg',
  };
  return map[ext] || 'application/octet-stream';
};

// GET /videos/:id/stream - Stream video with range request support
const streamVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const video = await Video.findOne({ _id: id, tenantId });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check if video is completed (optional: you might want to stream during processing)
    if (video.status !== 'completed') {
      return res.status(400).json({
        message: 'Video is not ready for streaming',
        status: video.status,
      });
    }

    // Prefer compressed version if available (smaller file = faster streaming)
    const filePath = video.compressedFilePath || video.preparedFilePath || video.filePath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Video file not found' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = video.mimeType || getContentType(filePath);

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // No range header - send entire file
      const head = {
        'Accept-Ranges': 'bytes',
        'Content-Length': fileSize,
        'Content-Type': contentType,
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  streamVideo,
};
