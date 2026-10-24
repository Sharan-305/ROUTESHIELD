/**
 * RouteShield — Administrator Routes (Protected + Role-based Authorization)
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require authentication AND 'admin' role
router.use(protect);
router.use(authorize('admin'));

router.get('/incidents', adminController.getIncidentsForReview);
router.put('/incidents/:id/review', adminController.reviewIncident);
router.get('/stats', adminController.getPlatformStats);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
