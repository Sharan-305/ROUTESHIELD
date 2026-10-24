/**
 * RouteShield — Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRegistration, validateLogin } = require('../middleware/validationMiddleware');

router.post('/register', authLimiter, validateRegistration, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.get('/me', protect, authController.getMe);
router.post('/logout', authController.logout);

module.exports = router;
