const AuditLog = require('../models/auditLog');

exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.getLogs();
        res.json({ logs });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};
