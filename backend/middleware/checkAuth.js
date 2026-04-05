const { verifyToken } = require('../lib/jwt');
const { AppError } = require('../lib/errors');
const { prisma } = require('../db');

/**
 * Validates JWT and attaches req.user with id, email, role, status.
 */
async function checkAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }
    const token = header.slice(7);
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }
    if (user.status !== 'active') {
      throw new AppError('Account is inactive', 403);
    }

    req.user = user;
    next();
  } catch (e) {
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
    next(e);
  }
}

module.exports = { checkAuth };
