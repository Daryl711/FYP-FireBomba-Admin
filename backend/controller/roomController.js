const Room = require("../models/room");

// Request field -> rooms column for the devices installed in a room.
const DEVICE_FIELDS = {
  hasCamera: "has_camera",
  hasSensor: "has_sensor",
  hasWaterpump: "has_waterpump",
};

// Returns { error } or { devices } holding only the fields that were sent.
const parseDevices = (body) => {
  const devices = {};
  for (const [field, column] of Object.entries(DEVICE_FIELDS)) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== "boolean") {
      return { error: `${field} must be true or false` };
    }
    devices[column] = body[field];
  }
  return { devices };
};

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
    const { error: deviceError, devices } = parseDevices(req.body);
    if (deviceError) return res.status(400).json({ error: deviceError });
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
      devices,
    );
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
    const { error: deviceError, devices } = parseDevices(req.body);
    if (deviceError) return res.status(400).json({ error: deviceError });
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
      devices,
    );
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
