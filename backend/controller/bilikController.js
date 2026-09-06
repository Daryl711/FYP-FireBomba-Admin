const Bilik = require('../models/bilik');

exports.getBiliks = async (req, res) => {
    try {
        const biliks = await Bilik.getAllBiliks();
        res.json({ biliks });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.addBilik = async (req, res) => {
    const { bilikNumber, householdName } = req.body;
    try {
        if (!bilikNumber) return res.status(400).json({ error: "Bilik number is required" });
        const bilikId = await Bilik.addBilik(bilikNumber, householdName);
        res.status(201).json({ message: "Bilik created successfully", bilikId });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.updateBilik = async (req, res) => {
    const { id } = req.params;
    const { bilikNumber, householdName } = req.body;
    try {
        if (!bilikNumber) return res.status(400).json({ error: "Bilik number is required" });
        const affected = await Bilik.updateBilik(id, bilikNumber, householdName);
        if (!affected) return res.status(404).json({ error: "Bilik not found" });
        res.json({ message: "Bilik updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};

exports.deleteBilik = async (req, res) => {
    const { id } = req.params;
    try {
        const affected = await Bilik.deleteBilik(id);
        if (!affected) return res.status(404).json({ error: "Bilik not found" });
        res.json({ message: "Bilik deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
        console.error(error);
    }
};
