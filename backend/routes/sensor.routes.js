const express = require('express');
const sensorRouter = express.Router();
const sensorController = require('../controller/sensorController');
const authMiddleware = require('../middleware/auth');

sensorRouter.get('/sensors', authMiddleware, sensorController.getSensors);
sensorRouter.patch('/sensors/:id/toggle', authMiddleware, sensorController.toggleSensor);
sensorRouter.delete('/sensors/:id', authMiddleware, sensorController.deleteSensor);

module.exports = sensorRouter;
