const express = require("express");
const userRouter = express.Router();
const userController = require("../controller/userController");
const requireAdmin = require("../middleware/auth");

userRouter.get("/users", requireAdmin, userController.getUsers);
userRouter.post("/add-user", requireAdmin, userController.createUser);
userRouter.delete("/users/:id", requireAdmin, userController.deleteUser);

module.exports = userRouter;
