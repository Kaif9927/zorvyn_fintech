/**
 * Ensures PATCH bodies are not empty (after JSON parse). Use after express.json().
 * @param {string[]} fieldNames - allowed keys; at least one must be present on the body.
 */
function requireAtLeastOneBodyField(fieldNames) {
  return (req, res, next) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const has = fieldNames.some((f) =>
      Object.prototype.hasOwnProperty.call(body, f)
    );
    if (!has) {
      return res.status(400).json({
        success: false,
        error: 'At least one field is required to update',
      });
    }
    next();
  };
}

module.exports = { requireAtLeastOneBodyField };
