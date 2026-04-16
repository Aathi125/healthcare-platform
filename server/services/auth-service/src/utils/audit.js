const AuditLog = require("../models/AuditLog");

async function writeAudit({ action, actorUserId = null, targetUserId = null, ip = null, meta = {} }) {
  await AuditLog.create({ action, actorUserId, targetUserId, ip, meta });
}

module.exports = { writeAudit };
