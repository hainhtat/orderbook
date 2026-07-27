import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import { disconnectPrisma } from './database/client.js';

const env = getEnv();
const app = createApp({ env });
const server = createServer(app);

server.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}, shutting down...`);
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
