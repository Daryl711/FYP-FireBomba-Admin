const Room = require("../models/room");
const AuditLog = require("../models/auditLog");

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
  const { name, status, cameraEnabled, bilik_id: bilikId = null } = req.body;
  try {
    if (!name) return res.status(400).json({ error: "Room name is required" });
    if (
      bilikId !== null &&
      (!Number.isInteger(Number(bilikId)) || Number(bilikId) < 1)
    ) {
      return res.status(400).json({ error: "Bilik must be a valid bilik ID" });
    }
    const roomId = await Room.addRoom(
      name,
      status ?? "0",
      cameraEnabled ? 1 : 0,
      bilikId === null ? null : Number(bilikId),
    );
    await AuditLog.logAction(req.user, "CREATE", "room", roomId, {
      name,
      camera_enabled: Boolean(cameraEnabled),
      bilik_id: bilikId === null ? null : Number(bilikId),
    });
    res.status(201).json({ message: "Room created successfully", roomId });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
    console.error(error);
  }
};

exports.updateRoom = async (req, res) => {
  const { id } = req.params;
  const { name, status, cameraEnabled, bilik_id: bilikId } = req.body;
  try {
    if (!name) return res.status(400).json({ error: "Room name is required" });
    if (
      bilikId !== undefined &&
      bilikId !== null &&
      (!Number.isInteger(Number(bilikId)) || Number(bilikId) < 1)
    ) {
      return res.status(400).json({ error: "Bilik must be a valid bilik ID" });
    }
    const normalizedBilikId = bilikId == null ? bilikId : Number(bilikId);
    const affected = await Room.updateRoom(
      id,
      name,
      status ?? "0",
      cameraEnabled ? 1 : 0,
      normalizedBilikId,
    );
    if (!affected) return res.status(404).json({ error: "Room not found" });
    await AuditLog.logAction(req.user, "UPDATE", "room", id, {
      name,
      camera_enabled: Boolean(cameraEnabled),
      ...(normalizedBilikId !== undefined && { bilik_id: normalizedBilikId }),
    });
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
    await AuditLog.logAction(req.user, "DELETE", "room", id);
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
    console.error(error);
  }
};
