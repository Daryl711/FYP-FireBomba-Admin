const Room = require('../models/room');

exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.getAllRooms();
        res.json({ rooms });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.addRoom = async (req, res) => {
    const { name, status, cameraEnabled } = req.body;
    try {
        if (!name) return res.status(400).json({ error: "Room name is required" });
        const roomId = await Room.addRoom(name, status ?? '0', cameraEnabled ? 1 : 0);
        res.status(201).json({ message: "Room created successfully", roomId });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.updateRoom = async (req, res) => {
    const { id } = req.params;
    const { name, status, cameraEnabled } = req.body;
    try {
        if (!name) return res.status(400).json({ error: "Room name is required" });
        const affected = await Room.updateRoom(id, name, status ?? '0', cameraEnabled ? 1 : 0);
        if (!affected) return res.status(404).json({ error: "Room not found" });
        res.json({ message: "Room updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.deleteRoom = async (req, res) => {
    const { id } = req.params;
    try {
        const affected = await Room.deleteRoom(id);
        if (!affected) return res.status(404).json({ error: "Room not found" });
        res.json({ message: "Room deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};
