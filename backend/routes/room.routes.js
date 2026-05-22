const express = require('express');
const roomRouter = express.Router();
const roomController = require('../controller/roomController');
const authMiddleware = require('../middleware/auth');

roomRouter.get('/rooms', authMiddleware, roomController.getRooms);
roomRouter.post('/rooms', authMiddleware, roomController.addRoom);
roomRouter.put('/rooms/:id', authMiddleware, roomController.updateRoom);
roomRouter.delete('/rooms/:id', authMiddleware, roomController.deleteRoom);

module.exports = roomRouter;
