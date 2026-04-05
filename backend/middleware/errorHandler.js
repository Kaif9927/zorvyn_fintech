const { sendError } = require('../lib/errors');

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);
  return sendError(res, err);
}

module.exports = { errorHandler };
