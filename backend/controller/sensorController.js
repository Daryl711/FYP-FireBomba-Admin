const Sensor = require('../models/sensor');
const AuditLog = require('../models/auditLog');

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
        const sensor = await Sensor.getSensorById(id);
        if (!sensor) return res.status(404).json({ error: "Sensor not found" });

        const affected = await Sensor.toggleSensorStatus(id);
        if (!affected) return res.status(404).json({ error: "Sensor not found" });

        const newStatus = sensor.status === 1 || sensor.status === true ? 'Disabled' : 'Enabled';
        await AuditLog.createLog({
            userId: req.user?.id,
            performedBy: req.user?.email,
            action: `Sensor ${newStatus}`,
            sensorId: sensor.sensor_id,
            sensorType: sensor.sensor_type,
            roomName: sensor.room_name,
            details: `Sensor #${id} (${sensor.sensor_type}) in ${sensor.room_name} was ${newStatus.toLowerCase()}`,
        });

        res.json({ message: "Sensor status updated" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.deleteSensor = async (req, res) => {
    try {
        const { id } = req.params;
        const sensor = await Sensor.getSensorById(id);
        if (!sensor) return res.status(404).json({ error: "Sensor not found" });

        const affected = await Sensor.deleteSensor(id);
        if (!affected) return res.status(404).json({ error: "Sensor not found" });

        await AuditLog.createLog({
            userId: req.user?.id,
            performedBy: req.user?.email,
            action: 'Sensor Deleted',
            sensorId: sensor.sensor_id,
            sensorType: sensor.sensor_type,
            roomName: sensor.room_name,
            details: `Sensor #${id} (${sensor.sensor_type}) in ${sensor.room_name} was deleted`,
        });

        res.json({ message: "Sensor deleted" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};
