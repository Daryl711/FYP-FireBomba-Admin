const db = require("../config/database");

exports.getAllUsers = async () => {
    const sql = "SELECT user_id, full_name, email, role, created_at FROM Users ORDER BY full_name ASC";
    const [result] = await db.query(sql);
    return result;
};

exports.deleteUser = async (userId) => {
    const sql = "DELETE FROM Users WHERE user_id = ?";
    const [result] = await db.query(sql, [userId]);
    return result.affectedRows;
};

exports.addUserByAdmin = async (fullName, email, hashedPassword, role) => {
    const sql = "INSERT INTO Users (room_id, full_name, email, password, role) VALUES (1, ?, ?, ?, ?)";
    const [result] = await db.query(sql, [fullName, email, hashedPassword, role]);
    return result.insertId;
};
