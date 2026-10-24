/**
 * RouteShield — Incident Reporting Routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const incidentController = require('../controllers/incidentController');
const { protect } = require('../middleware/authMiddleware');
const { validateIncidentSubmission } = require('../middleware/validationMiddleware');
const config = require('../config');

// Ensure upload directory exists
const uploadDir = path.resolve(process.cwd(), config.uploads.directory);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, `incident_${uniqueSuffix}${ext}`);
  }
});

// File filter (strictly images)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.uploads.maxSizeMb * 1024 * 1024 // 5 MB limit
  }
});

// Routes
router.post(
  '/',
  protect,
  upload.single('photo'),
  validateIncidentSubmission,
  incidentController.submitIncident
);

router.get('/public', incidentController.getPublicIncidents);
router.get('/my', protect, incidentController.getMyIncidents);

module.exports = router;
