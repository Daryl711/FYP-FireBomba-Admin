const express = require('express');
const actuatorRouter = express.Router();
const actuatorController = require('../controller/actuatorController');
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

actuatorRouter.get('/actuators', authMiddleware, requireAdmin, actuatorController.getActuators);

module.exports = actuatorRouter;
