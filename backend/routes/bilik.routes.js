const express = require("express");
const bilikRouter = express.Router();
const bilikController = require("../controller/bilikController");
const requireToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

bilikRouter.get("/", requireToken, requireAdmin, bilikController.getBilik);
bilikRouter.post("/", requireToken, requireAdmin, bilikController.createBilik);
bilikRouter.put("/:id", requireToken, requireAdmin, bilikController.updateBilik);
bilikRouter.delete("/:id", requireToken, requireAdmin, bilikController.deleteBilik);

module.exports = bilikRouter;
