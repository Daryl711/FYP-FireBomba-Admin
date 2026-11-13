const express = require('express');
const alertRouter = express.Router();
const alertController = require('../controller/alertController');
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

alertRouter.get('/alerts', authMiddleware, requireAdmin, alertController.getAlerts);
alertRouter.patch('/alerts/:id/acknowledge', authMiddleware, requireAdmin, alertController.acknowledgeAlert);
alertRouter.delete('/alerts/:id', authMiddleware, requireAdmin, alertController.deleteAlert);

module.exports = alertRouter;
