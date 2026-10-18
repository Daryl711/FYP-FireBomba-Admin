const AuditLog = require("../models/auditLog");

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN"];
const ENTITIES = ["admin", "user", "bilik", "room", "alert", "sensor"];

exports.getAuditLogs = async (req, res) => {
  const { entity, action } = req.query;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  if (entity && !ENTITIES.includes(entity)) {
    return res.status(400).json({ error: "Invalid entity filter" });
  }
  if (action && !ACTIONS.includes(action)) {
    return res.status(400).json({ error: "Invalid action filter" });
  }

  try {
    const { logs, total } = await AuditLog.getLogs({ entity, action, limit, offset });
    res.json({ logs, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
};
