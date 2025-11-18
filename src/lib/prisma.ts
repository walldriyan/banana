// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// This setup prevents creating a new PrismaClient instance on every hot reload in development.
const prismaClientSingleton = () => {
  return new PrismaClient({
    // Optional: Enable logging to see the queries Prisma is running
    // log: ['query', 'info', 'warn', 'error'],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// If a prisma instance doesn't exist, create one.
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
