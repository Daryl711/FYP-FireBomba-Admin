const express = require('express');
const actuatorRouter = express.Router();
const actuatorController = require('../controller/actuatorController');
const authMiddleware = require('../middleware/auth');

actuatorRouter.get('/actuators', authMiddleware, actuatorController.getActuators);
actuatorRouter.get('/actuators/rooms-without', authMiddleware, actuatorController.getRoomsWithoutActuator);
actuatorRouter.post('/actuators', authMiddleware, actuatorController.createActuator);

module.exports = actuatorRouter;
