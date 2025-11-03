const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const absentController = require('../controllers/absentController');

if (!attendanceController.getAttendanceData) {
    console.error("Error: getAttendanceData is undefined in attendanceController");
}

// Route for attendance data
router.get('/attendancesdata', attendanceController.getAttendanceData);

// Route to create an absent record
router.post('/absent', absentController.createAbsentRecord);

// Route for bulk assignment (inserting many records)
router.post('/assign', absentController.bulkAssign);

router.put('/absent/:id', absentController.updateAbsentRecord);

// Route to get all absent records
router.get('/absent', absentController.getAllAbsentRecords);

// Route to get absent records filtered by registration number and faculty name
router.get('/absent/filter', absentController.getAbsentRecordsByFacultyAndRegistration);

module.exports = router;
