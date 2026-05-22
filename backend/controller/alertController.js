const AlertModel = require('../models/alert');

exports.getAlerts = async (req, res) => {
    try {
        const alerts = await AlertModel.getAllAlerts();
        res.json({ alerts });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.acknowledgeAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const affected = await AlertModel.acknowledgeAlert(id);
        if (!affected) return res.status(404).json({ error: "Alert not found" });
        res.json({ message: "Alert updated" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.deleteAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const affected = await AlertModel.deleteAlert(id);
        if (!affected) return res.status(404).json({ error: "Alert not found" });
        res.json({ message: "Alert deleted" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};
