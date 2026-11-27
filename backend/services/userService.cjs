const pool = require("../config/db.cjs");

const SAFE_USER_COLUMNS = `
  id,
  first_name,
  last_name,
  email,
  is_admin,
  is_email_verified,
  verification_expires_at,
  verification_last_sent_at,
  verification_attempts,
  created_at
`;

// ---------- GETTERS ----------

async function getUserById(id, { includePasswordHash = false, includeVerificationHash = false } = {}) {
  const extraCols = [
    includePasswordHash ? "password_hash" : null,
    includeVerificationHash ? "verification_code_hash" : null
  ].filter(Boolean);

  const columns = extraCols.length
    ? `${SAFE_USER_COLUMNS}, ${extraCols.join(", ")}`
    : SAFE_USER_COLUMNS;

  const [rows] = await pool.execute(
    `SELECT ${columns} FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function getUserByEmail(email, { includePasswordHash = false, includeVerificationHash = false } = {}) {
  const extraCols = [
    includePasswordHash ? "password_hash" : null,
    includeVerificationHash ? "verification_code_hash" : null
  ].filter(Boolean);

  const columns = extraCols.length
    ? `${SAFE_USER_COLUMNS}, ${extraCols.join(", ")}`
    : SAFE_USER_COLUMNS;

  const [rows] = await pool.execute(
    `SELECT ${columns} FROM users WHERE email = ? LIMIT 1`,
    [email.trim().toLowerCase()]
  );
  return rows[0] || null;
}

async function getAllUsers() {
  const [rows] = await pool.execute(
    `SELECT ${SAFE_USER_COLUMNS} FROM users ORDER BY created_at DESC`
  );
  return rows;
}

async function getVerificationStateByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT
       id,
       email,
       is_email_verified,
       verification_code_hash,
       verification_expires_at,
       verification_last_sent_at,
       verification_attempts
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email.trim().toLowerCase()]
  );
  return rows[0] || null;
}

// ---------- SETTERS (CREATE) ----------

async function createUser({
  firstName,
  lastName,
  email,
  passwordHash,
  isAdmin = false,
  isEmailVerified = false,
  verificationCodeHash = null,
  verificationExpiresAt = null,
  verificationLastSentAt = null
}) {
  const normalizedEmail = email.trim().toLowerCase();

  const [result] = await pool.execute(
    `INSERT INTO users (
       first_name,
       last_name,
       email,
       password_hash,
       is_admin,
       is_email_verified,
       verification_code_hash,
       verification_expires_at,
       verification_last_sent_at,
       verification_attempts
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      firstName.trim(),
      lastName.trim(),
      normalizedEmail,
      passwordHash,
      Boolean(isAdmin),
      Boolean(isEmailVerified),
      verificationCodeHash,
      verificationExpiresAt,
      verificationLastSentAt
    ]
  );

  return getUserById(result.insertId);
}

// ---------- SETTERS / UPDATERS ----------

async function setProfile(userId, { firstName, lastName, email }) {
  const updates = [];
  const params = [];

  if (firstName !== undefined) {
    updates.push("first_name = ?");
    params.push(firstName.trim());
  }
  if (lastName !== undefined) {
    updates.push("last_name = ?");
    params.push(lastName.trim());
  }
  if (email !== undefined) {
    updates.push("email = ?");
    params.push(email.trim().toLowerCase());
  }

  if (updates.length === 0) return getUserById(userId);

  params.push(userId);
  await pool.execute(
    `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  return getUserById(userId);
}

async function setPasswordHash(userId, passwordHash) {
  const [result] = await pool.execute(
    "UPDATE users SET password_hash = ? WHERE id = ?",
    [passwordHash, userId]
  );
  return result.affectedRows > 0;
}

async function setAdminStatus(userId, isAdmin) {
  const [result] = await pool.execute(
    "UPDATE users SET is_admin = ? WHERE id = ?",
    [Boolean(isAdmin), userId]
  );
  return result.affectedRows > 0;
}

async function setVerificationCode(userId, { codeHash, expiresAt, sentAt }) {
  const [result] = await pool.execute(
    `UPDATE users
     SET verification_code_hash = ?,
         verification_expires_at = ?,
         verification_last_sent_at = ?,
         verification_attempts = 0
     WHERE id = ?`,
    [codeHash, expiresAt, sentAt, userId]
  );
  return result.affectedRows > 0;
}

async function incrementVerificationAttempts(userId) {
  const [result] = await pool.execute(
    `UPDATE users
     SET verification_attempts = verification_attempts + 1
     WHERE id = ?`,
    [userId]
  );
  return result.affectedRows > 0;
}

async function setEmailVerified(userId, isVerified = true) {
  const [result] = await pool.execute(
    `UPDATE users
     SET is_email_verified = ?,
         verification_code_hash = NULL,
         verification_expires_at = NULL,
         verification_attempts = 0
     WHERE id = ?`,
    [Boolean(isVerified), userId]
  );
  return result.affectedRows > 0;
}

// ---------- DELETE ----------

async function deleteUserById(userId) {
  const [result] = await pool.execute(
    "DELETE FROM users WHERE id = ?",
    [userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getUserById,
  getUserByEmail,
  getAllUsers,
  getVerificationStateByEmail,
  createUser,
  setProfile,
  setPasswordHash,
  setAdminStatus,
  setVerificationCode,
  incrementVerificationAttempts,
  setEmailVerified,
  deleteUserById
};