const express = require("express");
const userRouter = express.Router();
const userController = require("../controller/userController");
const requireToken = require("../middleware/auth");

userRouter.get("/", requireToken, userController.getUsers);
userRouter.post("/", requireToken, userController.createUser);
userRouter.put("/:id/bilik", requireToken, userController.assignBilik);
userRouter.delete("/:id", requireToken, userController.deleteUser);

module.exports = userRouter;
