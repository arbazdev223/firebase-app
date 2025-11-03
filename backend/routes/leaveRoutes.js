const express = require('express');
const router = express.Router();
const multer = require('multer');
const leaveController = require('../controllers/LeavebankController');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Apply for leave (with file upload)
router.post('/apply', upload.single('file'), leaveController.applyLeave);

// Update leave status (approve/reject)
router.put('/update-status/:leaveId', leaveController.updateLeaveStatus);

// Get all leave applications
router.get('/all', leaveController.getAllLeaves);

// Get leave applications for a specific user
router.get('/user/:userId', leaveController.getUserLeaves);

// Delete a leave application
router.delete('/delete/:leaveId', leaveController.deleteLeaveApplication);

module.exports = router;
