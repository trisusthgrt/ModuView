const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const app = require('./app');
const { setIOInstance } = require('./controllers/videoController');
const jwt = require('jsonwebtoken');
const { Video } = require('./models/Video');

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Expose io instance to video controller for processing service
setIOInstance(io);

// Socket auth + tenant isolation
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
    };
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected', socket.id);

  // Join tenant room automatically for tenant-scoped broadcasts
  const tenantId = socket.data?.user?.tenantId;
  if (tenantId) {
    socket.join(`tenant:${tenantId}`);
  }

  // Join video-specific room for targeted updates
  socket.on('join:video', async (videoId) => {
    try {
      const user = socket.data?.user;
      if (!user?.tenantId) return;

      const canAccess = await Video.exists({ _id: videoId, tenantId: user.tenantId });
      if (!canAccess) return;

      socket.join(`video:${videoId}`);
      console.log(`Client ${socket.id} joined video room: ${videoId}`);
    } catch {
      // ignore
    }
  });

  socket.on('leave:video', (videoId) => {
    socket.leave(`video:${videoId}`);
    console.log(`Client ${socket.id} left video room: ${videoId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

