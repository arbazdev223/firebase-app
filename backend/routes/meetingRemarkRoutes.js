const express = require('express');
const router = express.Router();
const meetingRemarkController = require('../controllers/MeetingRemarkController');

// Route to create a new meeting remark
router.post('/meeting-remark', meetingRemarkController.createMeetingRemark);

// Route to get all meeting remarks
router.get('/meeting-remarks', meetingRemarkController.getAllMeetingRemarks);

// Route to get a meeting remark by ID
router.get('/meeting-remark/:id', meetingRemarkController.getMeetingRemarkById);

module.exports = router;
