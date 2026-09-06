const db = require("../config/database");

exports.getAllBiliks = async () => {
    const sql = `
        SELECT b.bilik_id, b.bilik_number, b.household_name, b.created_at,
               COUNT(r.room_id) AS room_count
        FROM Bilik b
        LEFT JOIN Rooms r ON r.bilik_id = b.bilik_id
        GROUP BY b.bilik_id
        ORDER BY b.bilik_number ASC
    `;
    const [result] = await db.query(sql);
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
