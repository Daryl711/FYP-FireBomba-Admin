const express = require("express");
const userRouter = express.Router();
const userController = require("../controller/userController");
const requireToken = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

userRouter.get("/", requireToken, requireAdmin, userController.getUsers);
userRouter.post("/", requireToken, requireAdmin, userController.createUser);
userRouter.put("/:id/bilik", requireToken, requireAdmin, userController.assignBilik);
userRouter.delete("/:id", requireToken, requireAdmin, userController.deleteUser);

module.exports = userRouter;
