# Video Upload, Sensitivity Processing, and Streaming Application

A comprehensive full-stack application for uploading videos, processing them for content sensitivity analysis, and providing seamless video streaming capabilities with real-time progress tracking.

## 🎯 Features

- **Video Management**: Upload, store, and manage video files with metadata
- **Content Analysis**: Automated sensitivity detection (safe/flagged classification)
- **Real-Time Updates**: Live processing progress tracking via WebSocket (Socket.io)
- **Video Streaming**: HTTP range request-based video playback
- **Multi-Tenant Architecture**: Complete data isolation between organizations
- **Role-Based Access Control (RBAC)**:
  - **Viewer**: View and stream videos in their tenant
  - **Editor**: Upload, manage videos, and compress videos
  - **Admin**: Full access + user management within tenant
- **Video Compression**: Reduce file sizes with quality presets (Editor only)
- **Responsive UI**: Modern, organized interface with dark theme

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Real-Time**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Video Processing**: FFmpeg/FFprobe (optional, bundled via `ffmpeg-static`)

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **HTTP Client**: Axios
- **Real-Time**: Socket.io Client
- **Routing**: React Router DOM
- **State Management**: React Context API

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (Latest LTS version recommended) - [Download](https://nodejs.org/)
- **MongoDB Atlas Account** (or local MongoDB) - [Sign Up](https://www.mongodb.com/cloud/atlas)
- **Git** (for version control)

Optional:
- **FFmpeg + FFprobe** (only needed if you want metadata extraction and/or transcoding)
  - Bundled via `ffmpeg-static` and `ffprobe-static` packages (no system install needed)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/video-app.git
cd video-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` file:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/video-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
UPLOAD_DIR=uploads
FRONTEND_URL=http://localhost:5173
ENABLE_TRANSCODE=false
```

Start the backend:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env` file:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## 📖 User Guide

### Getting Started

#### 1. Register an Account

1. Click **"Register"** on the login page
2. Fill in:
   - **Email**: Your email address
   - **Password**: Strong password
   - **Tenant ID**: Your organization identifier (e.g., `org-1`, `company-abc`)
   - **Role**: Choose `admin`, `editor`, or `viewer`
3. Click **"Register"**

**Note**: For testing, create at least one `admin` account first.

#### 2. Login

1. Enter your email and password
2. Click **"Login"**
3. You'll be redirected to the Dashboard

### Dashboard Overview

The dashboard shows:
- **User Info**: Your email, role, and tenant ID
- **Upload Section** (Editor/Admin only): Upload new videos
- **Video List**: All videos in your tenant with:
  - Title, Status, Sensitivity, Owner
  - Real-time progress bars
  - Actions (View, Delete)

### Uploading Videos (Editor/Admin)

1. On the Dashboard, scroll to **"Upload Video"** section
2. Enter an optional title
3. Click **"Choose File"** and select a video file
4. Click **"Upload Video"**
5. Watch the upload progress
6. After upload, the video appears in the list with status **"processing"**

### Video Processing

After upload:
- Video status changes to **"processing"**
- Progress updates appear in real-time (0% → 100%)
- Processing includes:
  - Metadata extraction (duration, resolution, codec)
  - Sensitivity analysis (safe/flagged classification)
- When complete:
  - Status becomes **"completed"**
  - Sensitivity shows as **"safe"** or **"flagged"**

### Viewing and Streaming Videos

1. Click **"View"** next to any completed video
2. Video Detail page shows:
   - Title, description, metadata
   - Status and sensitivity badges
   - Video player (for completed videos)
3. Use the video player controls:
   - Play/Pause
   - Seek (jump to any position)
   - Fullscreen
   - Volume control

### Compressing Videos (Editor Only)

1. Go to Video Detail page
2. Scroll to **"Compress Video"** section
3. Select quality:
   - **Low**: 720p, ~800kbps (smallest file)
   - **Medium**: 1080p, ~2000kbps (balanced)
   - **High**: 1080p, ~4000kbps (best quality)
4. Click **"Compress"**
5. Wait for compression (may take a few minutes)
6. Compressed version is automatically used for streaming

### Downloading Videos (Editor Only)

1. On Video Detail page, click **"Download"** button
2. Downloads compressed version (if available) or original video

### Managing Users (Admin Only)

1. Login as **Admin**
2. Click **"Admin"** button in dashboard header
3. **Create User**:
   - Enter email, password, and role
   - Click **"Create User"**
4. **Update Role**:
   - Use dropdown in Users table to change user roles
5. **Delete User**:
   - Click **"Delete"** button (cannot delete yourself)

### Filtering Videos

On Dashboard:
- **Status Filter**: Filter by `uploaded`, `processing`, `completed`, or `failed`
- **Sensitivity Filter**: Filter by `pending`, `safe`, or `flagged`
- Click **"Refresh"** to reload the list

## 🔐 User Roles & Permissions

### Viewer
- ✅ View all videos in their tenant
- ✅ Stream completed videos
- ❌ Cannot upload videos
- ❌ Cannot delete videos
- ❌ Cannot compress videos
- ❌ Cannot download videos
- ❌ Cannot manage users

### Editor
- ✅ All Viewer permissions
- ✅ Upload videos
- ✅ Edit video metadata (title, description)
- ✅ Delete videos
- ✅ Compress videos
- ✅ Download videos
- ❌ Cannot manage users

### Admin
- ✅ All Editor permissions
- ✅ Create users
- ✅ Update user roles
- ✅ Delete users (within tenant)
- ❌ Cannot compress videos (Editor-only feature)

## 🌐 Deployment

### Production Deployment Guide

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete step-by-step instructions.

**Quick Overview**:
- **Frontend**: Deploy to [Vercel](https://vercel.com)
- **Backend**: Deploy to [Render](https://render.com)
- **Database**: Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### Environment Variables for Production

#### Render (Backend)
```
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/video-app
JWT_SECRET=your-production-secret-key
FRONTEND_URL=https://your-app.vercel.app
UPLOAD_DIR=uploads
ENABLE_TRANSCODE=false
```

#### Vercel (Frontend)
```
VITE_API_URL=https://your-backend.onrender.com
```

## 📚 API Documentation

### Base URL
- **Local**: `http://localhost:5000`
- **Production**: `https://your-backend.onrender.com`

### Authentication

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

### Endpoints

#### Authentication

**POST** `/auth/register`
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "tenantId": "org-1",
  "role": "editor"
}
```

**POST** `/auth/login`
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**GET** `/auth/me` - Get current user info

#### Videos

**POST** `/videos` - Upload video (Editor/Admin)
- Content-Type: `multipart/form-data`
- Fields: `video` (file), `title` (optional), `description` (optional)

**GET** `/videos` - List videos
- Query params: `status`, `sensitivityStatus`, `from`, `to`, `minSize`, `maxSize`

**GET** `/videos/:id` - Get video details

**PATCH** `/videos/:id` - Update video (Editor/Admin)

**DELETE** `/videos/:id` - Delete video (Editor/Admin)

**GET** `/videos/:id/stream` - Stream video
- Query param: `token=<JWT>` (for HTML video tag)

**GET** `/videos/:id/download` - Download video (Editor only)

**POST** `/videos/:id/compress` - Compress video (Editor only)
```json
{
  "quality": "low" | "medium" | "high"
}
```

#### Admin

**GET** `/admin/users` - List users (Admin only)

**POST** `/admin/users` - Create user (Admin only)

**PATCH** `/admin/users/:id` - Update user role (Admin only)

**DELETE** `/admin/users/:id` - Delete user (Admin only)

### Socket.io Events

**Connection**: Requires JWT token
```javascript
io(SERVER_URL, { auth: { token: JWT_TOKEN } })
```

**Events**:
- `video:progress` - Real-time processing progress
- `video:statusChanged` - Video status updates
- `video:compressed` - Compression completion

**Rooms**:
- `tenant:<tenantId>` - Auto-joined for tenant-scoped updates
- `video:<videoId>` - Join via `join:video` event

For detailed API documentation, see **[docs/API.md](./docs/API.md)**

## 🏗️ Architecture

### System Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │ ◄─────► │   Backend   │ ◄─────► │  MongoDB    │
│  (Vite)    │  REST   │  (Express)  │         │   Atlas     │
│            │         │             │         │             │
│  React     │ ◄─────► │  Socket.io  │         │             │
│  TypeScript│ WebSocket│  Server     │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              │ File Storage
                              ▼
                        ┌─────────────┐
                        │ Local Disk  │
                        │  (uploads/) │
                        └─────────────┘
```

### Data Flow

1. **Upload**: Client → Backend → File Storage → MongoDB
2. **Processing**: Background job → Progress updates → Socket.io → Frontend
3. **Streaming**: Frontend → Backend → File Storage → HTTP Range Requests

### Security

- **JWT Authentication**: Secure token-based auth
- **Multi-Tenant Isolation**: All queries filtered by `tenantId`
- **RBAC**: Role-based access control at route level
- **CORS**: Configured for frontend domain only
- **Password Hashing**: bcrypt with salt rounds

For detailed architecture, see **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

Tests use in-memory MongoDB and don't affect your production database.

### Manual Testing Checklist

- [ ] User registration
- [ ] User login
- [ ] Video upload (Editor/Admin)
- [ ] Real-time progress updates
- [ ] Video streaming
- [ ] Video compression (Editor)
- [ ] Video download (Editor)
- [ ] User management (Admin)
- [ ] Role-based access control
- [ ] Multi-tenant isolation

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start
- **Check**: MongoDB connection string is correct
- **Check**: Port is not already in use
- **Check**: All environment variables are set

#### Frontend can't connect to backend
- **Check**: `VITE_API_URL` matches backend URL
- **Check**: Backend is running
- **Check**: CORS settings allow frontend origin

#### Video upload fails
- **Check**: File size is under 500MB limit
- **Check**: File format is supported (MP4, MOV, AVI, WebM)
- **Check**: Backend has write permissions for `uploads/` directory

#### Socket.io not connecting
- **Check**: `FRONTEND_URL` in backend matches frontend URL exactly
- **Check**: JWT token is valid
- **Check**: Browser console for WebSocket errors

#### Build fails on Vercel
- **Check**: TypeScript errors are fixed
- **Check**: All dependencies are in `package.json`
- **Check**: Build command is correct (`npm run build`)

### Getting Help

1. Check the logs:
   - **Backend**: Render dashboard → Logs tab
   - **Frontend**: Vercel dashboard → Deployment → Build logs
2. Check environment variables are set correctly
3. Verify MongoDB Atlas connection and IP whitelist
4. Review error messages in browser console (F12)

## 📁 Project Structure

```
Assignment1/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, upload config
│   │   ├── controllers/     # Route handlers
│   │   ├── middlewares/     # Auth, error handling
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Business logic
│   │   ├── app.js          # Express app setup
│   │   └── server.js       # Server entry point
│   ├── tests/              # Test files
│   ├── uploads/            # Video storage (gitignored)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context
│   │   ├── pages/          # Page components
│   │   ├── realtime/       # Socket.io client
│   │   └── main.tsx        # Entry point
│   ├── public/             # Static assets
│   └── package.json
├── docs/                   # Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── ASSUMPTIONS.md
│   └── USER_MANUAL.md
├── DEPLOYMENT.md           # Deployment guide
└── README.md              # This file
```

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | Secret for JWT tokens | Required |
| `UPLOAD_DIR` | Directory for video storage | `uploads` |
| `FRONTEND_URL` | Frontend URL for CORS | Required |
| `ENABLE_TRANSCODE` | Enable FFmpeg transcoding | `false` |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | Required |

## 📝 Assumptions & Design Decisions

- **Sensitivity Analysis**: Simulated (70% safe, 30% flagged) - See [docs/ASSUMPTIONS.md](./docs/ASSUMPTIONS.md)
- **File Storage**: Local disk (can be migrated to cloud storage)
- **Processing**: Runs in Node process (can be moved to queue system)
- **Streaming**: HTTP range requests for HTML5 video compatibility

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is created for educational/assignment purposes.

## 🙏 Acknowledgments

- **Express.js** - Web framework
- **React** - UI library
- **MongoDB** - Database
- **Socket.io** - Real-time communication
- **Vite** - Build tool
- **FFmpeg** - Video processing

## 📞 Support

For issues, questions, or contributions:
- Check existing documentation in `docs/` folder
- Review deployment guide in `DEPLOYMENT.md`
- Check API documentation in `docs/API.md`

---

**Built with ❤️ using Node.js, React, and MongoDB**
