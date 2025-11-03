const express = require('express');
const router = express.Router();
const {
    createSEOTracking,
    getAllSEOTracking,
    getSEOTrackingByUser,
    getStats,
    verifyWork
} = require('../controllers/seoTrackingController');

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'SEO Tracking API is working' });
});

// Create new SEO tracking entry
router.post('/', createSEOTracking);

// Get all SEO tracking data (for admin)
router.get('/', getAllSEOTracking);

// Get statistics
router.get('/stats', getStats);

// Get SEO tracking data by user
router.get('/user/:userId', getSEOTrackingByUser);

// Verify work item
router.put('/verify', verifyWork);

module.exports = router; 