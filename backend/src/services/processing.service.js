const { Video, SENSITIVITY_STATUSES } = require('../models/Video');
const path = require('path');
const { probeVideo, transcodeToMp4 } = require('./ffmpeg.service');

// Simulated video processing with progress updates
const processVideo = async (videoId, io) => {
  const video = await Video.findById(videoId);
  if (!video) {
    console.error(`Video ${videoId} not found`);
    return;
  }

  // Update status to processing
  video.status = 'processing';
  video.progress = 0;
  await video.save();

  // Processing steps:
  // - metadata extraction (ffprobe if available)
  // - sensitivity analysis (simulated)
  // - streaming preparation (optional transcode)
  const steps = [
    { progress: 0, message: 'Upload validated' },
    { progress: 15, message: 'Extracting video metadata...' },
    { progress: 40, message: 'Analyzing video content...' },
    { progress: 65, message: 'Running sensitivity checks...' },
    { progress: 85, message: 'Preparing for streaming...' },
    { progress: 100, message: 'Processing complete' },
  ];

  const tenantRoom = `tenant:${video.tenantId}`;

  for (const step of steps) {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay per step

    // Step-specific work
    if (step.progress === 15) {
      try {
        const meta = await probeVideo(video.filePath);
        video.durationSeconds = meta.durationSeconds;
        video.width = meta.width;
        video.height = meta.height;
        video.codec = meta.codec;
        video.containerFormat = meta.containerFormat;
      } catch (err) {
        // ffprobe not installed or failed – keep going
        console.warn('ffprobe metadata extraction skipped:', err.message);
      }
    }

    if (step.progress === 85) {
      const enableTranscode = String(process.env.ENABLE_TRANSCODE || 'false') === 'true';
      if (enableTranscode) {
        try {
          const outDir = path.dirname(video.filePath);
          const prepared = await transcodeToMp4(video.filePath, outDir);
          video.preparedFilePath = prepared;
          video.mimeType = 'video/mp4';
        } catch (err) {
          console.warn('ffmpeg transcode skipped:', err.message);
        }
      }
    }

    // Persist progress so refreshes show correct state
    video.progress = step.progress;
    await video.save();

    // Emit progress only to this tenant
    io.to(tenantRoom).emit('video:progress', {
      videoId: video._id.toString(),
      progress: step.progress,
      status: 'processing',
      message: step.message,
    });

    // Also emit to a room for this specific video
    io.to(`video:${videoId}`).emit('video:progress', {
      videoId: video._id.toString(),
      progress: step.progress,
      status: 'processing',
      message: step.message,
    });
  }

  // Determine sensitivity status (simulated - random for demo)
  const sensitivityStatus =
    Math.random() > 0.3 ? SENSITIVITY_STATUSES[1] : SENSITIVITY_STATUSES[2]; // 70% safe, 30% flagged

  // Update video with final status
  video.status = 'completed';
  video.sensitivityStatus = sensitivityStatus;
  video.progress = 100;
  await video.save();

  // Emit completion event
  io.to(tenantRoom).emit('video:statusChanged', {
    videoId: video._id.toString(),
    status: 'completed',
    sensitivityStatus,
  });

  io.to(`video:${videoId}`).emit('video:statusChanged', {
    videoId: video._id.toString(),
    status: 'completed',
    sensitivityStatus,
  });

  console.log(`Video ${videoId} processing completed: ${sensitivityStatus}`);
};

module.exports = {
  processVideo,
};
