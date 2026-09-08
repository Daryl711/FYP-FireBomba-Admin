const db = require("../config/database");

exports.getAllBiliks = async () => {
    const sql = `
        SELECT b.bilik_id, b.bilik_number, b.household_name, b.created_at,
               COUNT(DISTINCT r.room_id) AS room_count,
               COUNT(DISTINCT u.user_id) AS resident_count
        FROM Bilik b
        LEFT JOIN Rooms r ON r.bilik_id = b.bilik_id
        LEFT JOIN Users u ON u.bilik_id = b.bilik_id
        GROUP BY b.bilik_id
        ORDER BY b.bilik_number ASC
    `;
    const [result] = await db.query(sql);
    return result;
};

exports.getUsersByBilik = async (bilikId) => {
    const sql = "SELECT user_id, full_name, email, role, created_at FROM Users WHERE bilik_id = ? ORDER BY full_name ASC";
    const [result] = await db.query(sql, [bilikId]);
    return result;
};

exports.addBilik = async (bilikNumber, householdName) => {
    const sql = "INSERT INTO Bilik (bilik_number, household_name) VALUES (?, ?)";
    const [result] = await db.query(sql, [bilikNumber, householdName ?? null]);
    return result.insertId;
};

exports.updateBilik = async (bilikId, bilikNumber, householdName) => {
    const sql = "UPDATE Bilik SET bilik_number = ?, household_name = ? WHERE bilik_id = ?";
    const [result] = await db.query(sql, [bilikNumber, householdName ?? null, bilikId]);
    return result.affectedRows;
};

exports.deleteBilik = async (bilikId) => {
    const sql = "DELETE FROM Bilik WHERE bilik_id = ?";
    const [result] = await db.query(sql, [bilikId]);
    return result.affectedRows;
};
