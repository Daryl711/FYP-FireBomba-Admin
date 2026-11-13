const express = require("express");
const auditLogRouter = express.Router();
const auditLogController = require("../controller/auditLogController");
const requireToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

auditLogRouter.get("/", requireToken, requireAdmin, auditLogController.getAuditLogs);

module.exports = auditLogRouter;
