import request from 'supertest';
import { createApp } from '../../src/app.js';
import { getEnv } from '../../src/config/env.js';

describe('health', () => {
  it('returns ok', async () => {
    const app = createApp({ env: getEnv() });
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('auth flow', () => {
  it('registers, creates shop, and verifies', async () => {
    const app = createApp({ env: getEnv() });

    const register = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Owner', email: 'owner@example.com', password: 'password123' });
    expect(register.status).toBe(201);
    expect(register.body.accessToken).toBeDefined();

    const token = register.body.accessToken as string;

    const shop = await request(app)
      .post('/api/v1/shops')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Glow Shop' });
    expect(shop.status).toBe(201);
    expect(shop.body.shop.name).toBe('Glow Shop');

    const verify = await request(app)
      .get('/api/v1/auth/verify')
      .set('Authorization', `Bearer ${token}`);
    expect(verify.status).toBe(200);
    expect(verify.body.user.email).toBe('owner@example.com');
    expect(verify.body.shop).toBeTruthy();
  });
});
