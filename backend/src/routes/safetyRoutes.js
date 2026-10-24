/**
 * RouteShield — Safety Data Routes
 */

const express = require('express');
const router = express.Router();
const safetyController = require('../controllers/safetyController');

router.get('/layers', safetyController.getSafetyLayers);

module.exports = router;
