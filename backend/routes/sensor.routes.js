const express = require('express');
const sensorRouter = express.Router();
const sensorController = require('../controller/sensorController');
const authMiddleware = require('../middleware/auth');

sensorRouter.get('/sensors', authMiddleware, sensorController.getSensors);

module.exports = sensorRouter;
