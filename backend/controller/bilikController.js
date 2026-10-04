const Bilik = require("../models/bilik");

const validateBilik = (bilikNumber, householdName) => {
  if (typeof bilikNumber !== "string" || !bilikNumber.trim()) {
    return "Bilik number is required";
  }
  if (bilikNumber.trim().length > 50) {
    return "Bilik number must be 50 characters or fewer";
  }
  if (householdName != null && typeof householdName !== "string") {
    return "Household name must be text";
  }
  if (householdName?.trim().length > 100) {
    return "Household name must be 100 characters or fewer";
  }
  return null;
};

exports.getBilik = async (req, res) => {
  try {
    const bilik = await Bilik.getAllBilik();
    res.json({ bilik });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch bilik" });
  }
};

exports.createBilik = async (req, res) => {
  const { bilik_number: bilikNumber, household_name: householdName } = req.body;
  const validationError = validateBilik(bilikNumber, householdName);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const bilik = await Bilik.createBilik(
      bilikNumber.trim(),
      householdName?.trim() || null,
    );
    res.status(201).json({ bilik });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create bilik" });
  }
};

exports.updateBilik = async (req, res) => {
  const { bilik_number: bilikNumber, household_name: householdName } = req.body;
  const validationError = validateBilik(bilikNumber, householdName);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const bilik = await Bilik.updateBilik(
      req.params.id,
      bilikNumber.trim(),
      householdName?.trim() || null,
    );
    if (!bilik) return res.status(404).json({ error: "Bilik not found" });
    res.json({ bilik });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update bilik" });
  }
};

exports.deleteBilik = async (req, res) => {
  try {
    const bilik = await Bilik.deleteBilik(req.params.id);
    if (!bilik) return res.status(404).json({ error: "Bilik not found" });
    res.json({ message: "Bilik deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete bilik" });
  }
};
