const path = require('path');
const fs = require('fs');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

describe('Videos API', () => {
  let mongo;
  let app;
  let Video;

  const registerAndLogin = async ({ email, password, tenantId, role }) => {
    await request(app)
      .post('/auth/register')
      .send({ email, password, tenantId, role })
      .expect(201);

    const login = await request(app)
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    return login.body.token;
  };

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongo.getUri();
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.UPLOAD_DIR = 'uploads-test';
    process.env.FRONTEND_URL = '*';

    app = require('../src/app');
    // Load model after mongoose connection exists
    ({ Video } = require('../src/models/Video'));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  test('editor can upload and list videos; viewer sees only assigned', async () => {
    const tenantId = 'tenant-a';
    const editorToken = await registerAndLogin({
      email: 'editor@example.com',
      password: 'Passw0rd!',
      tenantId,
      role: 'editor',
    });

    const viewerToken = await registerAndLogin({
      email: 'viewer@example.com',
      password: 'Passw0rd!',
      tenantId,
      role: 'viewer',
    });

    const fixturePath = path.join(__dirname, 'fixtures', 'sample.mp4');
    expect(fs.existsSync(fixturePath)).toBe(true);

    const upload = await request(app)
      .post('/videos')
      .set('Authorization', `Bearer ${editorToken}`)
      .field('title', 'Test Video')
      .attach('video', fixturePath, { contentType: 'video/mp4' })
      .expect(201);

    const videoId = upload.body.video.id;
    expect(videoId).toBeTruthy();

    const editorList = await request(app)
      .get('/videos')
      .set('Authorization', `Bearer ${editorToken}`)
      .expect(200);

    expect(Array.isArray(editorList.body.videos)).toBe(true);
    expect(editorList.body.videos.length).toBe(1);

    const viewerListBefore = await request(app)
      .get('/videos')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200);

    expect(viewerListBefore.body.videos.length).toBe(0);

    // Assign video to viewer
    const viewerUser = await mongoose.model('User').findOne({ email: 'viewer@example.com' });
    await request(app)
      .patch(`/videos/${videoId}/permissions`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ allowedUserIds: [viewerUser._id.toString()] })
      .expect(200);

    const viewerListAfter = await request(app)
      .get('/videos')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200);

    expect(viewerListAfter.body.videos.length).toBe(1);
  });

  test('range streaming works after marking video completed', async () => {
    const tenantId = 'tenant-b';
    const editorToken = await registerAndLogin({
      email: 'editor2@example.com',
      password: 'Passw0rd!',
      tenantId,
      role: 'editor',
    });

    const fixturePath = path.join(__dirname, 'fixtures', 'sample.mp4');

    const upload = await request(app)
      .post('/videos')
      .set('Authorization', `Bearer ${editorToken}`)
      .field('title', 'Stream Test')
      .attach('video', fixturePath, { contentType: 'video/mp4' })
      .expect(201);

    const videoId = upload.body.video.id;

    // Mark as completed so streaming endpoint allows it
    const v = await Video.findById(videoId);
    v.status = 'completed';
    v.sensitivityStatus = 'safe';
    v.progress = 100;
    await v.save();

    const res = await request(app)
      .get(`/videos/${videoId}/stream`)
      .set('Authorization', `Bearer ${editorToken}`)
      .set('Range', 'bytes=0-7')
      .expect(206);

    expect(res.headers['accept-ranges']).toBe('bytes');
    expect(res.headers['content-range']).toMatch(/^bytes 0-7\//);
  });
});

