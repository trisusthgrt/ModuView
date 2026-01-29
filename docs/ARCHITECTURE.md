# Architecture Overview

## Components

### Frontend (React + Vite)

- Pages:
  - Login/Register
  - Dashboard (upload + list + progress)
  - Video detail (player + metadata)
  - Admin users (admin-only)
- Networking:
  - REST via Axios
  - Real-time via Socket.io client

### Backend (Node + Express)

- REST endpoints:
  - Auth (`/auth`)
  - Videos (`/videos`)
  - Streaming (`/videos/:id/stream`)
  - Admin (`/admin`)
- Socket.io:
  - authenticated connection (`auth.token`)
  - tenant isolation rooms: `tenant:<tenantId>`
  - optional per-video rooms: `video:<videoId>`
- Database:
  - MongoDB + Mongoose models: `User`, `Video`
- Storage:
  - local filesystem via Multer (`UPLOAD_DIR`)

## Data Flow (Upload → Process → Stream)

1. **Upload**
   - Client sends multipart form-data to `POST /videos`
   - Multer stores file on disk
   - `Video` doc is created in MongoDB

2. **Processing**
   - Background “processing” updates:
     - `progress` saved into MongoDB
     - `video:progress` emitted to tenant room
   - Optional:
     - ffprobe extracts metadata
     - ffmpeg creates MP4 prepared file (if enabled)
   - Completion:
     - `status=completed`, `sensitivityStatus=safe|flagged`, `progress=100`
     - `video:statusChanged` emitted

3. **Streaming**
   - Client opens `GET /videos/:id/stream`
   - Backend supports range requests (206, `Content-Range`, `Accept-Ranges`)

## Security Model

- **JWT auth** for REST endpoints (and query token for streaming)
- **Multi-tenant isolation**
  - all queries are filtered by `tenantId`
  - sockets join tenant rooms only after JWT verification
- **RBAC**
  - viewer/editor/admin enforced at routes
- **Viewer assignment**
  - viewers see only `Video.allowedUsers` containing their user id

