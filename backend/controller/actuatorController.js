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
