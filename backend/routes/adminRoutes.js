const express = require('express');
const router = express.Router();
const Admin = require('../controllers/Admin');

const counsellorEvaluationController = require('../controllers/counsellorEvaluationController');

// Circular notifications
router.post('/circular-notifications', Admin.createCircularNotification);
router.get('/circular-notifications', Admin.getAllCircularNotifications);
router.get('/circular-notifications/:id', Admin.getCircularNotificationById);
router.put('/circular-notifications/:id', Admin.updateCircularNotification);
router.delete('/circular-notifications/:id', Admin.deleteCircularNotification);

// Admin Dashboard APIs
router.get('/dashboard-stats', Admin.getDashboardStats);
router.get('/revenue-stats', Admin.getRevenueStats);
router.get('/student-stats', Admin.getStudentStats);
router.get('/today-stats', Admin.getTodayStats);
router.get('/monthly-revenue-stats', Admin.getMonthlyRevenueStats);
router.get('/monthly-attendance-stats', Admin.getMonthlyAttendanceStats);
router.get('/student-course-distribution', Admin.getStudentCourseDistribution);
router.get('/enquiry-sources-stats', Admin.getEnquirySourcesStats);

router.get('/counsellor-evaluation', counsellorEvaluationController.getMonthlyCounsellorEvaluation);

// Enquiry Report Routes
router.get('/enquiry-report', Admin.getEnquiryReport);
router.post('/enquiry-report-export', Admin.exportEnquiryReport);

module.exports = router;
