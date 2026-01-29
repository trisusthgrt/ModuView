# User Manual

## Roles

- **Viewer**: can only see/stream videos they are assigned to.
- **Editor**: can upload and manage videos in their tenant.
- **Admin**: full access + user management in their tenant.

## Typical Workflow

### 1) Register / Login

1. Open frontend: `http://localhost:5173`
2. Register:
   - provide `email`, `password`, `tenantId`
   - choose a role (for demo: create one `admin` and one `editor` and one `viewer`)
3. Login if needed.

### 2) Upload a video (Editor/Admin)

1. Go to Dashboard (`/`)
2. Use **Upload Video** form
3. You will see upload progress.

### 3) Processing phase (real-time)

After upload:
- video status becomes **processing**
- progress updates appear in the dashboard list (Socket.io)

### 4) Review status

When processing completes:
- status becomes **completed**
- sensitivity becomes **safe** or **flagged**

### 5) Stream the video

1. Click **View**
2. If status is `completed`, the player will load
3. Seeking works (HTTP range requests)

### 6) Assign a video to a viewer (Editor/Admin)

Use the backend endpoint:
- `PATCH /videos/:id/permissions`

Then the viewer can see the video in their dashboard and stream it.

### 7) Admin: manage users

1. Login as **Admin**
2. Click **Admin** in the dashboard header
3. Create users, update roles, and delete users (within tenant)

