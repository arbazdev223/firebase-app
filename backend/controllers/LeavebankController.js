const ApplyLeave = require('../models/Leave'); // Adjust path to your model
const AWS = require('aws-sdk');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
// Configure R2 bucket (using AWS SDK)
const s3 = new AWS.S3({
    endpoint: 'https://582328aa44fe3bcd4d90060e0a558eae.r2.cloudflarestorage.com', // Updated environment variable name
    accessKeyId: '477949571b2baa26ff5b94195b93dd76', // Updated environment variable name
    secretAccessKey: 'd42e9da877365aabdbd7b59c1e3a543cb20ce4a321801b249f8e29c51fb6a7c8', // Updated environment variable name
    region: 'auto', // Updated environment variable name
});

const BUCKET_NAME = 'lms'; // Updated environment variable name

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

exports.applyLeave = async (req, res) => {
  try {
      const { userId, leaveType, startDate, endDate, reason } = req.body;

      // Validate inputs
      if (!userId || !leaveType || !startDate || !endDate || !reason) {
          return res.status(400).json({ message: 'All fields are required.' });
      }

      let fileUrl = null; // Initialize fileUrl

      // Handle file upload if a file is provided
      if (req.file) {
          const fileKey = `user/Leave/${uuidv4()}_${req.file.originalname}`;
          await s3.upload({
              Bucket: BUCKET_NAME,
              Key: fileKey,
              Body: req.file.buffer,
              ContentType: req.file.mimetype,
          }).promise();

          fileUrl = `https://imsdata.ifda.in/${fileKey}`;
      }

      // Create a new leave application
      const leaveApplication = new ApplyLeave({
          userId,
          leaveType,
          startDate,
          endDate,
          reason,
          file: fileUrl // Corrected object assignment
      });

      const savedLeave = await leaveApplication.save();
      res.status(201).json({ message: 'Leave application submitted successfully.', leave: savedLeave });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'An error occurred while applying for leave.', error: err.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, approvedBy, comments } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Only "Approved" or "Rejected" are allowed.' });
    }

    const updatedLeave = await ApplyLeave.findByIdAndUpdate(
      leaveId,
      { status, approvedBy, comments },
      { new: true }
    );

    if (!updatedLeave) {
      return res.status(404).json({ message: 'Leave application not found.' });
    }

    res.status(200).json({ message: `Leave application ${status.toLowerCase()} successfully.`, leave: updatedLeave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An error occurred while updating the leave status.', error: err.message });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await ApplyLeave.find()
      .populate('userId', 'name email') // Populate user details
      .populate('approvedBy', 'name') // Populate approver details
      .exec();

    res.status(200).json({ leaves });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An error occurred while fetching leave applications.', error: err.message });
  }
};

exports.getUserLeaves = async (req, res) => {
  try {
    const { userId } = req.params;

    const userLeaves = await ApplyLeave.find({ userId })
      .populate('userId', 'name email') // Populate user details
      .exec();

    res.status(200).json({ leaves: userLeaves });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An error occurred while fetching user leave applications.', error: err.message });
  }
};

exports.deleteLeaveApplication = async (req, res) => {
  try {
    const { leaveId } = req.params;

    const deletedLeave = await ApplyLeave.findByIdAndDelete(leaveId);

    if (!deletedLeave) {
      return res.status(404).json({ message: 'Leave application not found.' });
    }

    res.status(200).json({ message: 'Leave application deleted successfully.', leave: deletedLeave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An error occurred while deleting the leave application.', error: err.message });
  }
};
