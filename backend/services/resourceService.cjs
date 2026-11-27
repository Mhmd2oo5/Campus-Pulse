const pool = require("../config/db.cjs");

const RESOURCE_COLUMNS = `
  id,
  name,
  building,
  category,
  tags,
  opening_hour,
  closing_hour,
  max_capacity,
  current_condition,
  latitude,
  longitude,
  is_active,
  created_by,
  created_at,
  updated_at
`;

// ---------- GETTERS ----------

async function getResourceById(id, { includeInactive = true } = {}) {
  const activeClause = includeInactive ? "" : " AND is_active = TRUE";
  const [rows] = await pool.execute(
    `SELECT ${RESOURCE_COLUMNS} FROM resources WHERE id = ?${activeClause} LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function getAllResources({
  search = "",
  category = "",
  building = "",
  includeInactive = false
} = {}) {
  const conditions = [];
  const params = [];

  if (!includeInactive) {
    conditions.push("is_active = TRUE");
  }

  if (category && category !== "All") {
    conditions.push("category = ?");
    params.push(category.trim());
  }

  if (building) {
    conditions.push("building = ?");
    params.push(building.trim());
  }

  if (search && search.trim() !== "") {
    const pattern = `%${search.trim()}%`;
    conditions.push("(name LIKE ? OR building LIKE ? OR tags LIKE ?)");
    params.push(pattern, pattern, pattern);
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.execute(
    `SELECT ${RESOURCE_COLUMNS} FROM resources ${whereSql} ORDER BY name ASC`,
    params
  );
  return rows;
}

async function getResourcesForMap({ includeInactive = false } = {}) {
  const activeClause = includeInactive ? "" : " AND is_active = TRUE";
  const [rows] = await pool.execute(
    `SELECT
       id,
       name,
       building,
       category,
       current_condition,
       latitude,
       longitude,
       is_active
     FROM resources
     WHERE latitude IS NOT NULL
       AND longitude IS NOT NULL${activeClause}
     ORDER BY name ASC`
  );
  return rows;
}

// ---------- SETTERS (CREATE) ----------

async function createResource({
  name,
  building,
  category,
  tags = null,
  openingHour = null,
  closingHour = null,
  maxCapacity = null,
  currentCondition = null,
  latitude = null,
  longitude = null,
  isActive = true,
  createdBy = null
}) {
  const [result] = await pool.execute(
    `INSERT INTO resources (
       name,
       building,
       category,
       tags,
       opening_hour,
       closing_hour,
       max_capacity,
       current_condition,
       latitude,
       longitude,
       is_active,
       created_by
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name.trim(),
      building.trim(),
      category,
      tags ? tags.trim() : null,
      openingHour,
      closingHour,
      maxCapacity ?? null,
      currentCondition ?? null,
      latitude ?? null,
      longitude ?? null,
      Boolean(isActive),
      createdBy ?? null
    ]
  );

  return getResourceById(result.insertId);
}

// ---------- SETTERS / UPDATERS ----------

async function updateResource(resourceId, fields = {}) {
  const columnMap = {
    name: "name",
    building: "building",
    category: "category",
    tags: "tags",
    openingHour: "opening_hour",
    closingHour: "closing_hour",
    maxCapacity: "max_capacity",
    currentCondition: "current_condition",
    latitude: "latitude",
    longitude: "longitude",
    isActive: "is_active"
  };

  const updates = [];
  const params = [];

  for (const [key, column] of Object.entries(columnMap)) {
    if (fields[key] !== undefined) {
      let value = fields[key];
      if (typeof value === "string" && (key === "name" || key === "building" || key === "tags")) {
        value = value.trim() || null;
      }
      if (key === "isActive") {
        value = Boolean(value);
      }
      updates.push(`${column} = ?`);
      params.push(value);
    }
  }

  if (updates.length === 0) {
    return getResourceById(resourceId);
  }

  params.push(resourceId);
  await pool.execute(
    `UPDATE resources SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  return getResourceById(resourceId);
}

async function setResourceCondition(resourceId, currentCondition) {
  const [result] = await pool.execute(
    "UPDATE resources SET current_condition = ? WHERE id = ?",
    [currentCondition, resourceId]
  );
  return result.affectedRows > 0;
}

async function setResourceActiveStatus(resourceId, isActive) {
  const [result] = await pool.execute(
    "UPDATE resources SET is_active = ? WHERE id = ?",
    [Boolean(isActive), resourceId]
  );
  return result.affectedRows > 0;
}

// ---------- DELETE ----------

async function deleteResourceById(resourceId) {
  const [result] = await pool.execute(
    "DELETE FROM resources WHERE id = ?",
    [resourceId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getResourceById,
  getAllResources,
  getResourcesForMap,
  createResource,
  updateResource,
  setResourceCondition,
  setResourceActiveStatus,
  deleteResourceById
};