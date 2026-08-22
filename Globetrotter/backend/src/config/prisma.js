const { PrismaClient } = require('@prisma/client');

// Reuse a single PrismaClient instance (prevents connection exhaustion
// in dev when nodemon hot-reloads).
const prisma = global.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

module.exports = prisma;
