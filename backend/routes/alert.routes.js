const express = require('express');
const alertRouter = express.Router();
const alertController = require('../controller/alertController');
const authMiddleware = require('../middleware/auth');

alertRouter.get('/alerts', authMiddleware, alertController.getAlerts);
alertRouter.patch('/alerts/:id/acknowledge', authMiddleware, alertController.acknowledgeAlert);
alertRouter.delete('/alerts/:id', authMiddleware, alertController.deleteAlert);

module.exports = alertRouter;
