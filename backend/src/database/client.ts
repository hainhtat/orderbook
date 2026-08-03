import { PrismaClient } from '../../generated/client/index.js';
import type { Env } from '../config/env.js';

let prisma: PrismaClient | null = null;

export function createPrismaClient(_env: Env): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export function getPrisma(): PrismaClient {
  if (!prisma) {
    throw new Error('Prisma client not initialized');
  }
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
