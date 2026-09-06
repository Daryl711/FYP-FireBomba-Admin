const db = require("../config/database");

exports.getAllActuators = async () => {
    const sql = `
        SELECT a.actuator_id, a.room_id, a.waterpump_enabled, a.activated_status, a.last_updated,
               CASE WHEN r.space_type = 'BILIK_ROOM' THEN CONCAT(b.bilik_number, ' - ', r.name) ELSE r.name END AS room_name
        FROM Actuators a
        JOIN Rooms r ON a.room_id = r.room_id
        LEFT JOIN Bilik b ON r.bilik_id = b.bilik_id
        ORDER BY a.actuator_id ASC
    `;
    const [result] = await db.query(sql);
    return result;
};

exports.getRoomsWithoutActuator = async () => {
    const sql = `
        SELECT r.room_id,
               CASE WHEN r.space_type = 'BILIK_ROOM' THEN CONCAT(b.bilik_number, ' - ', r.name) ELSE r.name END AS name
        FROM Rooms r
        LEFT JOIN Bilik b ON r.bilik_id = b.bilik_id
        LEFT JOIN Actuators a ON r.room_id = a.room_id
        WHERE a.actuator_id IS NULL OR a.waterpump_enabled = FALSE
        ORDER BY r.name ASC
    `;
    const [result] = await db.query(sql);
    return result;
};

exports.enableWaterpump = async (roomId) => {
    const [existing] = await db.query('SELECT actuator_id FROM Actuators WHERE room_id = ?', [roomId]);
    if (existing.length > 0) {
        await db.query(
            'UPDATE Actuators SET waterpump_enabled = TRUE, last_updated = NOW() WHERE room_id = ?',
            [roomId]
        );
        return existing[0].actuator_id;
    }
    const [result] = await db.query(
        'INSERT INTO Actuators (room_id, waterpump_enabled, activated_status, last_updated) VALUES (?, TRUE, FALSE, NOW())',
        [roomId]
    );
    return result.insertId;
};
