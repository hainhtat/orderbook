import { beforeAll, afterAll, beforeEach } from '@jest/globals';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { resetEnvCache } from '../../src/config/env.js';
import { disconnectPrisma } from '../../src/database/client.js';

const tmpDir = path.join(process.cwd(), 'tests/tmp');
const dbPath = path.join(tmpDir, 'test.db');

beforeAll(() => {
  fs.mkdirSync(tmpDir, { recursive: true });
  for (const file of [dbPath, `${dbPath}-journal`]) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.JWT_SECRET = 'test-secret-key-min-16-chars';
  process.env.JWT_ISSUER = 'order-notebook-test';
  process.env.JWT_AUDIENCE = 'order-notebook-api-test';
  process.env.AI_ENCRYPTION_KEY = 'test-encryption-key-32-bytes!!!!';
  process.env.CORS_ORIGINS = 'http://localhost:5173';
  resetEnvCache();
  execSync('npx prisma db push --schema prisma/sqlite/schema.prisma', {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'ignore',
  });
});

beforeEach(() => {
  resetEnvCache();
});

afterAll(async () => {
  await disconnectPrisma();
});
