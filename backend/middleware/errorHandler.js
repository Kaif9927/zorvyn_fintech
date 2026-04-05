const { Prisma } = require('@prisma/client');
const { sendError } = require('../lib/errors');

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = err.meta?.target;
      return res.status(409).json({
        success: false,
        error: 'A record with this value already exists',
        details: Array.isArray(fields) ? { fields } : undefined,
      });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'Invalid reference: related record does not exist',
      });
    }
  }

  return sendError(res, err);
}

module.exports = { errorHandler };
