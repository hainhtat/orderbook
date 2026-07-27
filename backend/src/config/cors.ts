import cors from 'cors';
import type { Env } from './env.js';

export function createCorsOptions(env: Env): cors.CorsOptions {
  const origins = env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  return {
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Shop-Id'],
  };
}
