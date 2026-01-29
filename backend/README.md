# Backend (Node + Express + MongoDB)

## Run locally

1. Create `backend/.env` using `backend/.env.example`
2. Install + run:

```bash
npm install
npm run dev
```

Server: `http://localhost:5000`

## Environment variables

See `.env.example`:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `UPLOAD_DIR`
- `FRONTEND_URL`
- `ENABLE_TRANSCODE` (optional)

## Tests

```bash
npm test
```

## Main code locations

- App entry: `src/app.js`
- Server + Socket.io: `src/server.js`
- Models: `src/models/*`
- Routes: `src/routes/*`
- Processing: `src/services/processing.service.js`

