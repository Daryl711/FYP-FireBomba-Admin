const express = require('express');
const rateLimit = require('express-rate-limit');
const authRouter = express.Router();
const authController = require('../controller/authController');

// Throttle login attempts to slow down password brute-force / credential stuffing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

authRouter.post('/login', loginLimiter, authController.login);
authRouter.post('/logout', authController.logout);

module.exports = authRouter;
