const db = require("../config/database");

exports.getAllRooms = async () => {
    const sql = "SELECT room_id, name, status, last_updated, camera_enabled FROM Rooms ORDER BY name ASC";
    const [result] = await db.query(sql);
    return result;
};

exports.addRoom = async (name, status, cameraEnabled) => {
    const sql = "INSERT INTO Rooms (name, status, camera_enabled, last_updated) VALUES (?, ?, ?, NOW())";
    const [result] = await db.query(sql, [name, status, cameraEnabled]);
    return result.insertId;
};

exports.updateRoom = async (roomId, name, status, cameraEnabled) => {
    const sql = "UPDATE Rooms SET name = ?, status = ?, camera_enabled = ?, last_updated = NOW() WHERE room_id = ?";
    const [result] = await db.query(sql, [name, status, cameraEnabled, roomId]);
    return result.affectedRows;
};

exports.deleteRoom = async (roomId) => {
    const sql = "DELETE FROM Rooms WHERE room_id = ?";
    const [result] = await db.query(sql, [roomId]);
    return result.affectedRows;
};
