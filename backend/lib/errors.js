class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

function sendError(res, err) {
  const status = err.statusCode || 500;
  const message =
    status === 500 && process.env.NODE_ENV !== 'development'
      ? 'Something went wrong. Please try again later.'
      : err.message || 'Unexpected error';

  return res.status(status).json({
    success: false,
    error: message,
  });
}

module.exports = { AppError, sendError };
