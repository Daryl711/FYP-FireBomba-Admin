const express = require("express");
const roomRouter = express.Router();
const roomController = require("../controller/roomController");
const requireToken = require("../middleware/auth");

roomRouter.get("/", requireToken, roomController.getRooms);
roomRouter.post("/", requireToken, roomController.addRoom);
roomRouter.put("/:id", requireToken, roomController.updateRoom);
roomRouter.delete("/:id", requireToken, roomController.deleteRoom);

module.exports = roomRouter;
