const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Try to load ffmpeg-static and ffprobe-static (fallback to system if not available)
let ffmpegPath = 'ffmpeg';
let ffprobePath = 'ffprobe';

try {
  ffmpegPath = require('ffmpeg-static');
} catch (err) {
  console.warn('ffmpeg-static not found, using system ffmpeg');
}

try {
  ffprobePath = require('ffprobe-static').path;
} catch (err) {
  console.warn('ffprobe-static not found, using system ffprobe');
}

const run = (cmd, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) return resolve({ stdout, stderr });
      reject(new Error(`${cmd} exited with code ${code}: ${stderr}`));
    });
  });

async function probeVideo(filePath) {
  // ffprobe -v error -print_format json -show_format -show_streams <file>
  const { stdout } = await run(ffprobePath, [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    filePath,
  ]);
  const json = JSON.parse(stdout);

  const videoStream = Array.isArray(json.streams)
    ? json.streams.find((s) => s.codec_type === 'video')
    : null;

  const durationSeconds =
    json?.format?.duration != null ? Number(json.format.duration) : undefined;

  return {
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : undefined,
    width: videoStream?.width,
    height: videoStream?.height,
    codec: videoStream?.codec_name,
    containerFormat: json?.format?.format_name,
  };
}

async function transcodeToMp4(inputPath, outputDir) {
  const base = path.basename(inputPath, path.extname(inputPath));
  const outPath = path.join(outputDir, `${base}-prepared.mp4`);

  // ffmpeg -y -i <in> -movflags +faststart -c:v libx264 -preset veryfast -crf 28 -c:a aac -b:a 128k <out>
  await run(ffmpegPath, [
    '-y',
    '-i',
    inputPath,
    '-movflags',
    '+faststart',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '28',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    outPath,
  ]);

  return outPath;
}

/**
 * Compress video with quality level using ffmpeg-static (no system install required)
 * @param {string} inputPath - Input video file path
 * @param {string} outputDir - Output directory
 * @param {string} quality - 'low' | 'medium' | 'high'
 * @returns {Promise<{outputPath: string, originalSize: number, compressedSize: number}>}
 */
async function compressVideo(inputPath, outputDir, quality = 'medium') {
  const base = path.basename(inputPath, path.extname(inputPath));
  const outPath = path.join(outputDir, `${base}-compressed-${quality}.mp4`);

  // Quality presets
  const presets = {
    low: {
      crf: 32, // Higher CRF = lower quality/smaller file
      scale: '1280:720', // 720p
      videoBitrate: '800k',
      audioBitrate: '96k',
    },
    medium: {
      crf: 28,
      scale: '1920:1080', // 1080p
      videoBitrate: '2000k',
      audioBitrate: '128k',
    },
    high: {
      crf: 23, // Lower CRF = higher quality/larger file
      scale: '1920:1080',
      videoBitrate: '4000k',
      audioBitrate: '192k',
    },
  };

  const preset = presets[quality] || presets.medium;

  // Get original file size
  const originalSize = fs.statSync(inputPath).size;

  // Use ffmpeg-static (no system install required)
  const args = [
    '-y',
    '-i',
    inputPath,
    '-vf',
    `scale=${preset.scale}`,
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    String(preset.crf),
    '-b:v',
    preset.videoBitrate,
    '-maxrate',
    preset.videoBitrate,
    '-bufsize',
    String(parseInt(preset.videoBitrate) * 2) + 'k',
    '-c:a',
    'aac',
    '-b:a',
    preset.audioBitrate,
    '-movflags',
    '+faststart',
    outPath,
  ];

  await run(ffmpegPath, args);

  const compressedSize = fs.statSync(outPath).size;

  return {
    outputPath: outPath,
    originalSize,
    compressedSize,
  };
}

module.exports = {
  probeVideo,
  transcodeToMp4,
  compressVideo,
};

