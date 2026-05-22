const Sensor = require('../models/sensor');

exports.getSensors = async (req, res) => {
    try {
        const sensors = await Sensor.getAllSensors();
        res.json({ sensors });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.toggleSensor = async (req, res) => {
    try {
        const { id } = req.params;
        const affected = await Sensor.toggleSensorStatus(id);
        if (!affected) return res.status(404).json({ error: "Sensor not found" });
        res.json({ message: "Sensor status updated" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.deleteSensor = async (req, res) => {
    try {
        const { id } = req.params;
        const affected = await Sensor.deleteSensor(id);
        if (!affected) return res.status(404).json({ error: "Sensor not found" });
        res.json({ message: "Sensor deleted" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};
