const express = require('express');
const bilikRouter = express.Router();
const bilikController = require('../controller/bilikController');
const authMiddleware = require('../middleware/auth');

bilikRouter.get('/biliks', authMiddleware, bilikController.getBiliks);
bilikRouter.get('/biliks/:id/users', authMiddleware, bilikController.getBilikUsers);
bilikRouter.post('/biliks', authMiddleware, bilikController.addBilik);
bilikRouter.put('/biliks/:id', authMiddleware, bilikController.updateBilik);
bilikRouter.delete('/biliks/:id', authMiddleware, bilikController.deleteBilik);

module.exports = bilikRouter;
