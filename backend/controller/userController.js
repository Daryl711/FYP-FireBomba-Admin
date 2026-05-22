const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AdminUser = require('../models/adminUser');

exports.getUsers = async (req, res) => {
    try {
        const users = await AdminUser.getAllUsers();
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const affected = await AdminUser.deleteUser(id);
        if (!affected) return res.status(404).json({ error: "User not found" });
        res.json({ message: "User deleted" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.addUserByAdmin = async (req, res) => {
    const { fullName, email, password, role } = req.body;
    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ error: "Full name, email, and password are required" });
        }
        const doesEmailExist = await User.checkEmail(email);
        if (doesEmailExist) {
            return res.status(400).json({ error: "Email already registered" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = await AdminUser.addUserByAdmin(fullName, email, hashedPassword, role || 'User');
        res.status(201).json({ message: "User created successfully", userId });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};
