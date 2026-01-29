const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth.routes');
const videoRoutes = require('./routes/video.routes');
const streamRoutes = require('./routes/stream.routes');
const adminRoutes = require('./routes/admin.routes');

dotenv.config();

const app = express();

// Connect to database
connectDB();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Simple health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Routes
app.use('/auth', authRoutes);
// Mount stream routes first (more specific route)
app.use('/videos', streamRoutes);
app.use('/videos', videoRoutes);
app.use('/admin', adminRoutes);

// Error handler (should be last)
app.use(errorHandler);

module.exports = app;

