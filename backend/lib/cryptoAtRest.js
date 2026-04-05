/**
 * AES-256-GCM symmetric encryption for sensitive fields stored in the database.
 * Passwords for login remain bcrypt-hashed separately (one-way) — see lib/password.js.
 */
const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const IV_LEN = 16;
const AUTH_TAG_LEN = 16;

function getKeyBuffer() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || typeof hex !== 'string') {
    throw new Error(
      'ENCRYPTION_KEY is missing. Set a 64-character hex string (32 bytes), e.g. node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  const buf = Buffer.from(hex.trim(), 'hex');
  if (buf.length !== 32) {
    throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes (64 hex characters).');
  }
  return buf;
}

function encrypt(plainText) {
  if (plainText == null || plainText === '') return null;
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LEN });
  const enc = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decrypt(cipherBase64) {
  if (cipherBase64 == null || cipherBase64 === '') return null;
  const key = getKeyBuffer();
  const buf = Buffer.from(cipherBase64, 'base64');
  if (buf.length < IV_LEN + AUTH_TAG_LEN) {
    throw new Error('Invalid ciphertext');
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN);
  const data = buf.subarray(IV_LEN + AUTH_TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LEN });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/**
 * Decrypt note if it was stored encrypted; if decryption fails, return as-is (legacy plain text).
 */
function decryptNoteField(stored) {
  if (stored == null || stored === '') return null;
  try {
    return decrypt(stored);
  } catch {
    return stored;
  }
}

function mapRecordNotesOut(record) {
  if (!record) return record;
  return {
    ...record,
    note: decryptNoteField(record.note),
  };
}

module.exports = {
  encrypt,
  decrypt,
  decryptNoteField,
  mapRecordNotesOut,
};
