const Actuator = require('../models/actuator');

exports.getActuators = async (req, res) => {
    try {
        const actuators = await Actuator.getAllActuators();
        res.json({ actuators });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.getRoomsWithoutActuator = async (req, res) => {
    try {
        const rooms = await Actuator.getRoomsWithoutActuator();
        res.json({ rooms });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.createActuator = async (req, res) => {
    const { room_id } = req.body;
    if (!room_id) return res.status(400).json({ error: "room_id is required" });
    try {
        const actuatorId = await Actuator.enableWaterpump(room_id);
        res.status(201).json({ actuator_id: actuatorId });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};
