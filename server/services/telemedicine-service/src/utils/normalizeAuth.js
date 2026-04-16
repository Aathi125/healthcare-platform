function normalizeRole(role) {
  if (role == null) return null;
  return String(role).trim().toLowerCase();
}

function normalizeUserId(id) {
  if (id == null) return null;
  return String(id).trim();
}

module.exports = { normalizeRole, normalizeUserId };
