const db = require("../config/database");

exports.getAllRooms = async () => {
    const sql = `
        SELECT r.room_id, r.name, r.status, r.last_updated, r.camera_enabled,
               r.space_type, r.bilik_id, b.bilik_number, b.household_name
        FROM Rooms r
        LEFT JOIN Bilik b ON r.bilik_id = b.bilik_id
        ORDER BY r.name ASC
    `;
    const [result] = await db.query(sql);
    return result;
};

exports.addRoom = async (name, status, cameraEnabled, spaceType, bilikId) => {
    const sql = "INSERT INTO Rooms (name, status, camera_enabled, space_type, bilik_id, last_updated) VALUES (?, ?, ?, ?, ?, NOW())";
    const [result] = await db.query(sql, [name, status, cameraEnabled, spaceType, bilikId]);
    return result.insertId;
};

exports.updateRoom = async (roomId, name, status, cameraEnabled, spaceType, bilikId) => {
    const sql = "UPDATE Rooms SET name = ?, status = ?, camera_enabled = ?, space_type = ?, bilik_id = ?, last_updated = NOW() WHERE room_id = ?";
    const [result] = await db.query(sql, [name, status, cameraEnabled, spaceType, bilikId, roomId]);
    return result.affectedRows;
};

exports.deleteRoom = async (roomId) => {
    const sql = "DELETE FROM Rooms WHERE room_id = ?";
    const [result] = await db.query(sql, [roomId]);
    return result.affectedRows;
};
