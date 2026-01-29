const express = require('express');
const authMiddleware = require('../middlewares/auth');
const roleCheck = require('../middlewares/roleCheck');
const tenantCheck = require('../middlewares/tenantCheck');
const upload = require('../config/upload');
const {
  uploadVideo,
  listVideos,
  getVideo,
  updateVideo,
  deleteVideo,
  setVideoPermissions,
  compressVideoEndpoint,
  downloadVideo,
} = require('../controllers/videoController');

const router = express.Router();

// All routes require authentication and tenant check
router.use(authMiddleware);
router.use(tenantCheck());

// POST /videos - Upload (Editor/Admin only)
router.post(
  '/',
  roleCheck(['editor', 'admin']),
  upload.single('video'),
  uploadVideo
);

// GET /videos - List videos (all authenticated users)
router.get('/', listVideos);

// GET /videos/:id/download - Download video (prefers compressed if available)
// Must be before /:id route to match correctly
router.get('/:id/download', downloadVideo);

// GET /videos/:id - Get video details
router.get('/:id', getVideo);

// PATCH /videos/:id - Update video (Editor/Admin only)
router.patch('/:id', roleCheck(['editor', 'admin']), updateVideo);

// PATCH /videos/:id/permissions - Assign viewers (Editor/Admin only)
router.patch('/:id/permissions', roleCheck(['editor', 'admin']), setVideoPermissions);

// POST /videos/:id/compress - Compress video (Editor only)
router.post('/:id/compress', roleCheck(['editor']), compressVideoEndpoint);

// DELETE /videos/:id - Delete video (Editor/Admin only)
router.delete('/:id', roleCheck(['editor', 'admin']), deleteVideo);

module.exports = router;
