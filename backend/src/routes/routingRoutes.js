/**
 * RouteShield — Routing Routes
 */

const express = require('express');
const router = express.Router();
const routingController = require('../controllers/routingController');

router.get('/calculate', routingController.getRoutes);

module.exports = router;
