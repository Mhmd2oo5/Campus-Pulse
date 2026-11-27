const pool = require("../config/db.cjs");

// ---------- GETTERS ----------

async function getVoteByReportAndUser(reportId, userId) {
  const [rows] = await pool.execute(
    `SELECT id, report_id, user_id, vote_type, created_at, updated_at
     FROM votes
     WHERE report_id = ? AND user_id = ?
     LIMIT 1`,
    [reportId, userId]
  );
  return rows[0] || null;
}

async function getVoteSummaryForReport(reportId) {
  const [rows] = await pool.execute(
    `SELECT
       report_id,
       COALESCE(SUM(CASE WHEN vote_type = 'confirm' THEN 1 ELSE 0 END), 0) AS confirm_count,
       COALESCE(SUM(CASE WHEN vote_type = 'dispute' THEN 1 ELSE 0 END), 0) AS dispute_count,
       COUNT(*) AS total_votes
     FROM votes
     WHERE report_id = ?
     GROUP BY report_id`,
    [reportId]
  );

  return rows[0] || {
    report_id: reportId,
    confirm_count: 0,
    dispute_count: 0,
    total_votes: 0
  };
}

async function getVotesByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT id, report_id, user_id, vote_type, created_at, updated_at
     FROM votes
     WHERE user_id = ?
     ORDER BY updated_at DESC`,
    [userId]
  );
  return rows;
}

// ---------- SETTERS (CREATE / CHANGE VOTE) ----------

async function upsertVote({ reportId, userId, voteType }) {
  if (voteType !== "confirm" && voteType !== "dispute") {
    throw new Error("Invalid voteType. Expected 'confirm' or 'dispute'.");
  }

  const [reportRows] = await pool.execute(
    "SELECT id, user_id FROM reports WHERE id = ? LIMIT 1",
    [reportId]
  );

  if (reportRows.length === 0) {
    return { error: "REPORT_NOT_FOUND" };
  }

  if (Number(reportRows[0].user_id) === Number(userId)) {
    return { error: "SELF_VOTE_NOT_ALLOWED" };
  }

  await pool.execute(
    `INSERT INTO votes (report_id, user_id, vote_type)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       vote_type = VALUES(vote_type),
       updated_at = CURRENT_TIMESTAMP`,
    [reportId, userId, voteType]
  );

  const vote = await getVoteByReportAndUser(reportId, userId);
  const summary = await getVoteSummaryForReport(reportId);

  return { vote, summary };
}

// ---------- DELETE ----------

async function removeVote(reportId, userId) {
  const [result] = await pool.execute(
    "DELETE FROM votes WHERE report_id = ? AND user_id = ?",
    [reportId, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getVoteByReportAndUser,
  getVoteSummaryForReport,
  getVotesByUserId,
  upsertVote,
  removeVote
};