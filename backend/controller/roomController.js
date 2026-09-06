const Room = require('../models/room');

const SPACE_TYPES = ['BILIK_ROOM', 'RUAI', 'TANJU'];

function resolveSpaceAssignment(spaceType, bilikId) {
    const type = SPACE_TYPES.includes(spaceType) ? spaceType : 'BILIK_ROOM';
    if (type === 'BILIK_ROOM') {
        if (!bilikId) return { error: "bilikId is required for a Bilik room" };
        return { spaceType: type, bilikId };
    }
    return { spaceType: type, bilikId: null };
}

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
    const { name, status, cameraEnabled, spaceType, bilikId } = req.body;
    try {
        if (!name) return res.status(400).json({ error: "Room name is required" });
        const assignment = resolveSpaceAssignment(spaceType, bilikId);
        if (assignment.error) return res.status(400).json({ error: assignment.error });
        const roomId = await Room.addRoom(name, status ?? '0', cameraEnabled ? 1 : 0, assignment.spaceType, assignment.bilikId);
        res.status(201).json({ message: "Room created successfully", roomId });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.updateRoom = async (req, res) => {
    const { id } = req.params;
    const { name, status, cameraEnabled, spaceType, bilikId } = req.body;
    try {
        if (!name) return res.status(400).json({ error: "Room name is required" });
        const assignment = resolveSpaceAssignment(spaceType, bilikId);
        if (assignment.error) return res.status(400).json({ error: assignment.error });
        const affected = await Room.updateRoom(id, name, status ?? '0', cameraEnabled ? 1 : 0, assignment.spaceType, assignment.bilikId);
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
