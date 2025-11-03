const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// GET /api/reports/calls?start=YYYY-MM-DD&end=YYYY-MM-DD&caller=<id>&branch=<name>&limit=1000
router.get('/calls', reportController.getCallReports);

module.exports = router;
