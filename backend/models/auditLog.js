const db = require('../config/database');

exports.createLog = async ({ userId, performedBy, action, sensorId, sensorType, roomName, details }) => {
    const sql = `
        INSERT INTO AuditLog (user_id, performed_by, action, sensor_id, sensor_type, room_name, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [userId ?? null, performedBy ?? null, action, sensorId ?? null, sensorType ?? null, roomName ?? null, details ?? null]);
};

exports.getLogs = async () => {
    const sql = `SELECT * FROM AuditLog ORDER BY timestamp DESC`;
    const [rows] = await db.query(sql);
    return rows;
};
