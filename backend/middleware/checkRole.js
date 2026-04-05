const { AppError } = require('../lib/errors');

/**
 * @param {string[]} allowedRoles - e.g. ['Admin', 'Analyst']
 */
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
}

module.exports = { checkRole };
