class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} [statusCode=500]
   * @param {object} [details] - optional extra context (safe to expose to clients)
   */
  constructor(message, statusCode = 500, details) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (details !== undefined) this.details = details;
  }
}

function sendError(res, err) {
  const status = err.statusCode || 500;
  const message =
    status === 500 && process.env.NODE_ENV !== 'development'
      ? 'Something went wrong. Please try again later.'
      : err.message || 'Unexpected error';

  const payload = {
    success: false,
    error: message,
  };
  if (err.details && typeof err.details === 'object') {
    payload.details = err.details;
  }
  return res.status(status).json(payload);
}

module.exports = { AppError, sendError };
