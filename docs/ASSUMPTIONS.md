# Assumptions & Design Decisions

## Sensitivity analysis

- Implemented as a **simulated classifier**:
  - 70% chance **safe**, 30% chance **flagged**
- Reason: real ML/video moderation is out of scope for a short assignment, but the pipeline and reporting are implemented end-to-end.

## Processing pipeline

- Processing runs inside the Node server process (simple demo approach).
- Progress is persisted in MongoDB (`Video.progress`) and also emitted in real-time via Socket.io.

## Storage

- Files are stored on **local disk** under `UPLOAD_DIR` (default: `uploads/`).
- This can be swapped to S3 later if required.

## Streaming

- Streaming uses HTTP range requests.
- Because HTML `<video>` cannot send `Authorization` headers, the stream endpoint accepts JWT via `?token=...`.

## Multi-tenant + RBAC

- Tenant isolation is enforced by `tenantId` in the JWT and DB queries.
- Roles:
  - Viewer: assigned-only access (`Video.allowedUsers`)
  - Editor/Admin: upload/manage within tenant
  - Admin: user management endpoints (`/admin`)

## FFmpeg support (optional)

- If `ffprobe` is installed, metadata extraction is attempted.
- If `ENABLE_TRANSCODE=true` and `ffmpeg` is installed, the server may generate a prepared MP4 file for improved streaming.
- If ffmpeg/ffprobe are missing, the pipeline continues without failing.

