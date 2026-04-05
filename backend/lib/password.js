const bcrypt = require('bcryptjs');

const ROUNDS = 12;

/** Optional server-side secret mixed into the password before hashing (not stored in DB). */
function applyPepper(plain) {
  const pepper = process.env.PASSWORD_PEPPER || '';
  return pepper ? `${pepper}::${plain}` : plain;
}

/**
 * One-way password hashing (bcrypt). This is not reversible "decryption" —
 * login verifies by re-hashing the candidate password the same way.
 * For reversible field encryption (e.g. notes), see lib/cryptoAtRest.js.
 */
async function hashPassword(plain) {
  return bcrypt.hash(applyPepper(plain), ROUNDS);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(applyPepper(plain), hash);
}

module.exports = { hashPassword, comparePassword };
