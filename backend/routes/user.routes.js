const express = require("express");
const userRouter = express.Router();
const userController = require("../controller/userController");
const requireToken = require("../middleware/auth");

userRouter.get("/", requireToken, userController.getUsers);
userRouter.post("/", requireToken, userController.createUser);
userRouter.delete("/", requireToken, userController.deleteUser);

module.exports = userRouter;
