const express = require('express');
const sensorRouter = express.Router();
const sensorController = require('../controller/sensorController');
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

sensorRouter.get('/sensors', authMiddleware, requireAdmin, sensorController.getSensors);
sensorRouter.patch('/sensors/:id/toggle', authMiddleware, requireAdmin, sensorController.toggleSensor);
sensorRouter.delete('/sensors/:id', authMiddleware, requireAdmin, sensorController.deleteSensor);

module.exports = sensorRouter;
