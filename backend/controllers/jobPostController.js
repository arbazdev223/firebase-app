const JobPost = require('../models/JobPost');
const AWS = require('aws-sdk');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

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
// Create a new job post
exports.createJobPost = async (req, res) => {
  try {
    const { jobTitle, companyName, jobLocation, jobType, jobProfile, experience, qualification, closingDate, description } = req.body;
        let fileUrl = null;
        
        // Handle file upload
        if (req.file) {
            const fileKey = `hr/jobpost/${uuidv4()}_${req.file.originalname}`;
            await s3.upload({
                Bucket: BUCKET_NAME,
                Key: fileKey,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            }).promise();

            fileUrl = `${'https://imsdata.ifda.in/'}${fileKey}`; 
        }
    const newJobPost = new JobPost({
      jobTitle,
      file: fileUrl,
      companyName,
      jobLocation,
      jobType,
      jobProfile,
      experience,
      qualification,
      closingDate,
      description,
    });

    await newJobPost.save();
    res.status(201).json({ message: 'Job Post Created Successfully', newJobPost });
  } catch (error) {
    res.status(500).json({ message: 'Error creating job post', error });
  }
};

// Get all job posts
exports.getAllJobPosts = async (req, res) => {
  try {
    // Ensure no invalid filters are applied
    const jobPosts = await JobPost.find().lean(); // `.lean()` returns plain JS objects, improving performance
    res.status(200).json(jobPosts);
  } catch (error) {
    console.error('Error fetching job posts:', error.message); // Log error for debugging
    res.status(500).json({ message: 'Error fetching job posts', error: error.message });
  }
};

// Get a specific job post by ID
exports.getJobPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const jobPost = await JobPost.findById(id);
    if (!jobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    res.status(200).json(jobPost);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job post', error });
  }
};

// Update a job post
exports.updateJobPost = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedJobPost = await JobPost.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedJobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    res.status(200).json({ message: 'Job Post Updated Successfully', updatedJobPost });
  } catch (error) {
    res.status(500).json({ message: 'Error updating job post', error });
  }
};

// Delete a job post
exports.deleteJobPost = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedJobPost = await JobPost.findByIdAndDelete(id);
    if (!deletedJobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    res.status(200).json({ message: 'Job Post Deleted Successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting job post', error });
  }
};
