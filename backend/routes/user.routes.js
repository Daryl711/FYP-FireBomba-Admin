const express = require('express');
const userRouter = express.Router();
const userController = require('../controller/userController');
const authMiddleware = require('../middleware/auth');

userRouter.get('/users', authMiddleware, userController.getUsers);
userRouter.post('/admin/add-user', authMiddleware, userController.addUserByAdmin);
userRouter.delete('/users/:id', authMiddleware, userController.deleteUser);

module.exports = userRouter;
