const Sensor = require('../models/sensor');

exports.getSensors = async (req, res) => {
    try {
        const sensors = await Sensor.getSensorStatuses();
        res.json({
            sensors,
            offline_after_minutes: Sensor.OFFLINE_AFTER_MINUTES,
            checked_at: new Date().toISOString(),
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};
