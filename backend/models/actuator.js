const db = require("../config/database");

exports.getAllActuators = async () => {
    const sql = `
        SELECT a.actuator_id, a.room_id, a.waterpump_enabled, a.activated_status, a.last_updated,
               r.name AS room_name
        FROM Actuators a
        JOIN Rooms r ON a.room_id = r.room_id
        ORDER BY a.actuator_id ASC
    `;
    const [result] = await db.query(sql);
    return result;
};
