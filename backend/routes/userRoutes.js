// routes/userRoutes.js
const express = require('express');
const router = express.Router();
// const { createUser, testing_server } = require('../controllers/userController');
const checklistController = require('../controllers/checklistController'); 
const counsellorRevenueController = require('../controllers/counsellorRevenueController');

// POST /api/users to create a new user
// router.post('/fetch-users', createUser);

// router.post('/', testing_server);

router.get('/checklists', checklistController.getAllChecklists);
router.post('/submit-checklist', checklistController.submitChecklist);

// Report routes
router.get('/checklist-report', checklistController.getChecklistReport);
router.get('/user-submissions/:userId', checklistController.getUserSubmissions);
router.get('/daily-stats', checklistController.getDailyStats);
router.get('/export-checklist-report', checklistController.exportChecklistReport);
router.get('/checklist-analytics', checklistController.getChecklistAnalytics);
router.get('/analyze-checklist-data', checklistController.analyzeChecklistData);

// Employee Report Routes
router.get('/employee-checklist-report', checklistController.getEmployeeChecklistReport);
router.get('/admin-employee-summary', checklistController.getAdminEmployeeSummary);

// Performance Report Routes
router.get('/employee-performance-report', checklistController.getEmployeePerformanceReport);
router.get('/all-employees-performance-summary', checklistController.getAllEmployeesPerformanceSummary);

// Counsellor Revenue Target Report Routes
router.get('/counsellor-revenue-report', counsellorRevenueController.getIndividualCounsellorRevenueReport);
router.get('/organization-revenue-report', counsellorRevenueController.getOrganizationRevenueReport);
router.get('/revenue-target-summary', counsellorRevenueController.getRevenueTargetSummary);
router.get('/all-counsellors', counsellorRevenueController.getAllCounsellors);

// Debug endpoint for course data
router.get('/debug-course-data', counsellorRevenueController.debugCourseData);

module.exports = router;
