const express = require('express');
const router = express.Router();
const salarySlipController = require('../controllers/salarySlipController');

// Generate salary slips for all users for a month (admin/cron)
router.post('/generate', salarySlipController.generateMonthlySlips);

// Get all salary slips for a user
router.get('/user/:userId', salarySlipController.getUserSlips);

// Get department salary report for a month
router.get('/department-report', salarySlipController.getDepartmentReport);

// Get PDF for a salary slip
router.get('/pdf/:slipId', salarySlipController.getSlipPDF);

module.exports = router; 