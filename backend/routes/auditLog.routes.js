const express = require("express");
const auditLogRouter = express.Router();
const auditLogController = require("../controller/auditLogController");
const requireToken = require("../middleware/auth");

auditLogRouter.get("/", requireToken, auditLogController.getAuditLogs);

module.exports = auditLogRouter;
