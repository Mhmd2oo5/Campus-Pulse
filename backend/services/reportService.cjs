const pool = require("../config/db.cjs");

const REPORT_WITH_COUNTS_SELECT = `
  SELECT
    r.id,
    r.resource_id,
    r.user_id,
    r.reported_condition,
    r.comment,
    r.is_moderated,
    r.created_at,
    u.first_name AS author_first_name,
    u.last_name AS author_last_name,
    COALESCE(SUM(CASE WHEN v.vote_type = 'confirm' THEN 1 ELSE 0 END), 0) AS confirm_count,
    COALESCE(SUM(CASE WHEN v.vote_type = 'dispute' THEN 1 ELSE 0 END), 0) AS dispute_count
  FROM reports r
  INNER JOIN users u ON u.id = r.user_id
  LEFT JOIN votes v ON v.report_id = r.id
`;

// ---------- GETTERS ----------

async function getReportById(reportId) {
  const [rows] = await pool.execute(
    `${REPORT_WITH_COUNTS_SELECT}
     WHERE r.id = ?
     GROUP BY r.id, u.first_name, u.last_name
     LIMIT 1`,
    [reportId]
  );
  return rows[0] || null;
}

async function getReportsByResourceId(
  resourceId,
  { withinMinutes = null, includeModerated = false, limit = 50 } = {}
) {
  const conditions = ["r.resource_id = ?"];
  const params = [resourceId];

  if (!includeModerated) {
    conditions.push("r.is_moderated = FALSE");
  }

  if (Number.isFinite(withinMinutes) && withinMinutes > 0) {
    conditions.push("r.created_at >= (UTC_TIMESTAMP() - INTERVAL ? MINUTE)");
    params.push(Number(withinMinutes));
  }

  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  params.push(safeLimit);

  const [rows] = await pool.execute(
    `${REPORT_WITH_COUNTS_SELECT}
     WHERE ${conditions.join(" AND ")}
     GROUP BY r.id, u.first_name, u.last_name
     ORDER BY r.created_at DESC
     LIMIT ?`,
    params
  );
  return rows;
}

async function getFreshReportsByResourceId(resourceId, maxAgeMinutes = 120) {
  return getReportsByResourceId(resourceId, {
    withinMinutes: maxAgeMinutes,
    includeModerated: false,
    limit: 200
  });
}

async function getRecentUserReportForResource(userId, resourceId, windowMinutes = 10) {
  const [rows] = await pool.execute(
    `SELECT id, resource_id, user_id, reported_condition, comment, is_moderated, created_at
     FROM reports
     WHERE user_id = ?
       AND resource_id = ?
       AND is_moderated = FALSE
       AND created_at >= (UTC_TIMESTAMP() - INTERVAL ? MINUTE)
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, resourceId, Number(windowMinutes)]
  );
  return rows[0] || null;
}

async function getAllReports({ includeModerated = true, limit = 100 } = {}) {
  const whereSql = includeModerated ? "" : "WHERE r.is_moderated = FALSE";
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));

  const [rows] = await pool.execute(
    `${REPORT_WITH_COUNTS_SELECT}
     ${whereSql}
     GROUP BY r.id, u.first_name, u.last_name
     ORDER BY r.created_at DESC
     LIMIT ?`,
    [safeLimit]
  );
  return rows;
}

// ---------- SETTERS (CREATE) ----------

async function createReport({ resourceId, userId, reportedCondition, comment = null }) {
  const trimmedComment = typeof comment === "string" && comment.trim() !== ""
    ? comment.trim()
    : null;

  const [result] = await pool.execute(
    `INSERT INTO reports (resource_id, user_id, reported_condition, comment, is_moderated)
     VALUES (?, ?, ?, ?, FALSE)`,
    [resourceId, userId, reportedCondition.trim(), trimmedComment]
  );

  return getReportById(result.insertId);
}

// ---------- SETTERS / UPDATERS ----------

async function updateReport(reportId, { reportedCondition, comment }) {
  const updates = [];
  const params = [];

  if (reportedCondition !== undefined) {
    updates.push("reported_condition = ?");
    params.push(reportedCondition.trim());
  }
  if (comment !== undefined) {
    updates.push("comment = ?");
    params.push(typeof comment === "string" && comment.trim() !== "" ? comment.trim() : null);
  }

  if (updates.length === 0) {
    return getReportById(reportId);
  }

  params.push(reportId);
  await pool.execute(
    `UPDATE reports SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  return getReportById(reportId);
}

async function setReportModerated(reportId, isModerated) {
  const [result] = await pool.execute(
    "UPDATE reports SET is_moderated = ? WHERE id = ?",
    [Boolean(isModerated), reportId]
  );
  return result.affectedRows > 0;
}

// ---------- DELETE ----------

async function deleteReportById(reportId) {
  const [result] = await pool.execute(
    "DELETE FROM reports WHERE id = ?",
    [reportId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getReportById,
  getReportsByResourceId,
  getFreshReportsByResourceId,
  getRecentUserReportForResource,
  getAllReports,
  createReport,
  updateReport,
  setReportModerated,
  deleteReportById
};