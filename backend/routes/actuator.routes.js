const express = require('express');
const actuatorRouter = express.Router();
const actuatorController = require('../controller/actuatorController');
const authMiddleware = require('../middleware/auth');

actuatorRouter.get('/actuators', authMiddleware, actuatorController.getActuators);

module.exports = actuatorRouter;
