const express = require("express");
const roomRouter = express.Router();
const roomController = require("../controller/roomController");
const requireToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

roomRouter.get("/", requireToken, requireAdmin, roomController.getRooms);
roomRouter.post("/", requireToken, requireAdmin, roomController.addRoom);
roomRouter.put("/:id", requireToken, requireAdmin, roomController.updateRoom);
roomRouter.delete("/:id", requireToken, requireAdmin, roomController.deleteRoom);

module.exports = roomRouter;
