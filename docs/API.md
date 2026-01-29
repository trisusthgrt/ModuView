# API Documentation

Base URL (local): `http://localhost:5000`

All protected endpoints require:

- Header: `Authorization: Bearer <JWT>`

For video streaming (HTML `<video>` cannot send headers):

- Use query string: `GET /videos/:id/stream?token=<JWT>`

## Auth

### POST `/auth/register`

Body:

```json
{ "email": "a@b.com", "password": "Passw0rd!", "tenantId": "tenant-1", "role": "editor" }
```

Response: `{ token, user }`

### POST `/auth/login`

Body:

```json
{ "email": "a@b.com", "password": "Passw0rd!" }
```

Response: `{ token, user }`

### GET `/auth/me`

Response: `{ user }`

## Videos

### POST `/videos` (Editor/Admin)

Multipart form-data:

- `video` (file, required)
- `title` (string, optional)
- `description` (string, optional)

Response: `{ message, video }`

### GET `/videos`

Query params (optional):

- `status`: `uploaded|processing|completed|failed`
- `sensitivityStatus`: `pending|safe|flagged`
- `from`, `to`: ISO date strings
- `minSize`, `maxSize`: bytes

Response: `{ videos: [...] }`

### GET `/videos/:id`

Response: `{ video }`

### PATCH `/videos/:id` (Editor/Admin)

Body:

```json
{ "title": "New title", "description": "New description" }
```

### DELETE `/videos/:id` (Editor/Admin)

Response: `{ message }`

### PATCH `/videos/:id/permissions` (Editor/Admin)

Assign viewers to a video.

Body:

```json
{ "allowedUserIds": ["<userId1>", "<userId2>"] }
```

Notes:
- Owner is always kept in `allowedUsers`.
- Viewer role can only see videos they are assigned to.

## Streaming

### GET `/videos/:id/stream`

Supports HTTP range requests via `Range: bytes=start-end`.

Examples:

- Full: `GET /videos/:id/stream?token=<JWT>`
- Range: `Range: bytes=0-999999`

## Admin (Admin only)

### GET `/admin/users`

Lists users in the same tenant.

### POST `/admin/users`

Body:

```json
{ "email": "viewer@x.com", "password": "Passw0rd!", "role": "viewer" }
```

### PATCH `/admin/users/:id`

Body:

```json
{ "role": "editor" }
```

### DELETE `/admin/users/:id`

Deletes user (cannot delete self).

## Socket.io Events

Socket connection requires JWT via:

- client: `io(SERVER_URL, { auth: { token } })`

Events:

- `video:progress` payload: `{ videoId, progress, status, message }`
- `video:statusChanged` payload: `{ videoId, status, sensitivityStatus }`

Rooms:

- `tenant:<tenantId>` (auto-joined)
- `video:<videoId>` (join via `join:video` if authorized)

