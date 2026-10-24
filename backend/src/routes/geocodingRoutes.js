/**
 * RouteShield — Geocoding Routes
 */

const express = require('express');
const router = express.Router();
const geocodingController = require('../controllers/geocodingController');

router.get('/search', geocodingController.search);
router.get('/reverse', geocodingController.reverse);

module.exports = router;
