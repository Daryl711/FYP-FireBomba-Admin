const express = require('express');
const router = express.Router();
const auditController = require('../controller/auditController');
const auth = require('../middleware/auth');

router.get('/audit-logs', auth, auditController.getAuditLogs);

module.exports = router;
