const db = require("../config/database");

exports.getAllAlerts = async () => {
    const sql = "SELECT alert_id, room_id, timestamp, warning_title, is_read FROM AlertNotification ORDER BY timestamp DESC";
    const [result] = await db.query(sql);
    return result;
};

exports.acknowledgeAlert = async (alertId) => {
    const sql = "UPDATE AlertNotification SET is_read = NOT is_read WHERE alert_id = ?";
    const [result] = await db.query(sql, [alertId]);
    return result.affectedRows;
};

exports.deleteAlert = async (alertId) => {
    const sql = "DELETE FROM AlertNotification WHERE alert_id = ?";
    const [result] = await db.query(sql, [alertId]);
    return result.affectedRows;
};
