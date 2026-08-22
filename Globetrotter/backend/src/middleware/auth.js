const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

// Requires a valid Bearer token. Attaches { id, email, role } to req.user.
const requireAuth = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Not authenticated. Please log in.');

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token.');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) throw new ApiError(401, 'User no longer exists.');

  req.user = { id: user.id, email: user.email, role: user.role };
  next();
});

// Optional auth: attaches req.user if a valid token is present, otherwise
// continues anonymously. Used for the public/shared itinerary endpoints.
const optionalAuth = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (user) req.user = { id: user.id, email: user.email, role: user.role };
  } catch (err) {
    // ignore invalid token on optional routes
  }
  next();
});

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(new ApiError(403, 'Admin access required.'));
  }
  next();
};

module.exports = { requireAuth, optionalAuth, requireAdmin };
