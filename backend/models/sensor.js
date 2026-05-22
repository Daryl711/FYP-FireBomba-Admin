const db = require("../config/database");

exports.getAllSensors = async () => {
    const sql = `
        SELECT s.sensor_id, s.room_id, s.sensor_type, s.status, s.last_updated,
               r.name AS room_name
        FROM AdminSensor s
        JOIN Rooms r ON s.room_id = r.room_id
        ORDER BY s.room_id ASC, s.sensor_type ASC
    `;
    const [result] = await db.query(sql);
    return result;
};

exports.toggleSensorStatus = async (sensorId) => {
    const sql = "UPDATE AdminSensor SET status = NOT status, last_updated = NOW() WHERE sensor_id = ?";
    const [result] = await db.query(sql, [sensorId]);
    return result.affectedRows;
};

exports.deleteSensor = async (sensorId) => {
    const sql = "DELETE FROM AdminSensor WHERE sensor_id = ?";
    const [result] = await db.query(sql, [sensorId]);
    return result.affectedRows;
};
