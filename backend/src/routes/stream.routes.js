const express = require('express');
const authMiddleware = require('../middlewares/auth');
const tenantCheck = require('../middlewares/tenantCheck');
const { streamVideo } = require('../controllers/streamController');

const router = express.Router();

// All routes require authentication and tenant check
router.use(authMiddleware);
router.use(tenantCheck());

// GET /videos/:id/stream - Stream video
router.get('/:id/stream', streamVideo);

module.exports = router;
