const express = require("express");
const bilikRouter = express.Router();
const bilikController = require("../controller/bilikController");
const requireToken = require("../middleware/auth");

bilikRouter.get("/", requireToken, bilikController.getBilik);
bilikRouter.post("/", requireToken, bilikController.createBilik);
bilikRouter.put("/:id", requireToken, bilikController.updateBilik);
bilikRouter.delete("/:id", requireToken, bilikController.deleteBilik);

module.exports = bilikRouter;
