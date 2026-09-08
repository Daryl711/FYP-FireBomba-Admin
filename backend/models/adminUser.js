const db = require("../config/database");

exports.getAllUsers = async () => {
    const sql = `
        SELECT u.user_id, u.full_name, u.email, u.role, u.created_at,
               u.bilik_id, b.bilik_number, b.household_name
        FROM Users u
        LEFT JOIN Bilik b ON b.bilik_id = u.bilik_id
        ORDER BY u.full_name ASC
    `;
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

exports.assignBilik = async (userId, bilikId) => {
    const sql = "UPDATE Users SET bilik_id = ? WHERE user_id = ?";
    const [result] = await db.query(sql, [bilikId, userId]);
    return result.affectedRows;
};
