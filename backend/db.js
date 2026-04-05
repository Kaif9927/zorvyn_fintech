const { PrismaClient } = require('@prisma/client');

// Single Prisma instance for the whole app (avoids connection spam in dev)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

module.exports = { prisma };
