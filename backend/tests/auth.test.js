const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

describe('Auth API', () => {
  let mongo;
  let app;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongo.getUri();
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.UPLOAD_DIR = 'uploads-test';
    process.env.FRONTEND_URL = '*';

    // Require app after env is set (app connects immediately)
    app = require('../src/app');
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  test('register -> login -> me', async () => {
    const email = 'user1@example.com';
    const password = 'Passw0rd!';
    const tenantId = 'tenant-a';

    const reg = await request(app)
      .post('/auth/register')
      .send({ email, password, tenantId, role: 'editor' })
      .expect(201);

    expect(reg.body.token).toBeTruthy();
    expect(reg.body.user.email).toBe(email);
    expect(reg.body.user.tenantId).toBe(tenantId);

    const login = await request(app)
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    expect(login.body.token).toBeTruthy();

    const me = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(me.body.user.email).toBe(email);
    expect(me.body.user.role).toBe('editor');
    expect(me.body.user.tenantId).toBe(tenantId);
  });
});

