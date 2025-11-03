const Assignment = require('../models/Assignment');
const BackupAssignment = require('../models/BackupAssignment');
const User = require('../models/User');
const Joi = require('joi');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

// Database optimization settings
const DB_QUERY_TIMEOUT = 5000; // 5 seconds
const MAX_CONTENT_LENGTH = 16000000; // 16MB MongoDB limit
const CONTENT_TRUNCATE_LENGTH = 500; // Characters to show in list views

// Configure R2 bucket (using AWS SDK)
const s3 = new AWS.S3({
    endpoint: 'https://582328aa44fe3bcd4d90060e0a558eae.r2.cloudflarestorage.com', // Updated environment variable name
    accessKeyId: '477949571b2baa26ff5b94195b93dd76', // Updated environment variable name
    secretAccessKey: 'd42e9da877365aabdbd7b59c1e3a543cb20ce4a321801b249f8e29c51fb6a7c8', // Updated environment variable name
    region: 'auto', // Updated environment variable name
});
const fs = require('fs');
const BUCKET_NAME = 'lms'; // Updated environment variable name

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });


// Validation schema
const assignmentSchema = Joi.object({
  userId: Joi.string().required(),
  mainCourse: Joi.array().items(Joi.string()).required(),
  selectedCourses: Joi.array()
    .items(
      Joi.alternatives().try(
        Joi.string(),  // Allow string items
        Joi.object({
          value: Joi.string().required(),
          label: Joi.string().required(),
        })
      )
    )
    .optional(),
  topicName: Joi.string().required(),
  editorContent: Joi.string().required(),  // HTML string for content
});

// Create a new assignment
exports.createAssignment = async (req, res) => {
  try {
      console.log('Incoming Request Body:', req.body);

      const { userId, mainCourse, selectedCourses, topicName, editorContent } = req.body || {};

      // Validate request body
      const { error } = assignmentSchema.validate(req.body);
      if (error) {
          return res.status(400).json({ success: false, message: error.details[0].message });
      }

      let fileUrl = null;

      // Handle file upload
      if (req.file) {
          const fileKey = `user/thumb/${uuidv4()}_${req.file.originalname}`;
          await s3.upload({
              Bucket: BUCKET_NAME,
              Key: fileKey,
              Body: req.file.buffer,
              ContentType: req.file.mimetype,
          }).promise();

          fileUrl = `https://imsdata.ifda.in/${fileKey}`;
      }

      // Save assignment to database
      const newAssignment = new Assignment({
          userId,
          mainCourse,
          course: selectedCourses,
          topicName,
          content: editorContent,
          thumb: fileUrl,
      });

      await newAssignment.save();

      return res.status(201).json({
          success: true,
          message: 'Assignment created successfully',
          data: newAssignment,
      });

  } catch (error) {
      console.error('Error creating assignment:', error);
      return res.status(500).json({ success: false, message: 'Error creating assignment', error: error.message });
  }
};

// Update an assignment
exports.updateAssignment = async (req, res) => {
  try {
      const { assignmentId } = req.params;
      console.log('Update Assignment Request Body:', req.body);
      console.log('Update Assignment File:', req.file);

      // Parse FormData fields properly
      let mainCourse = req.body.mainCourse;
      let selectedCourses = req.body.selectedCourses;
      
      console.log('Raw mainCourse:', mainCourse, 'Type:', typeof mainCourse);
      console.log('Raw selectedCourses:', selectedCourses, 'Type:', typeof selectedCourses);
      
      // Convert comma-separated strings to arrays if they come as strings
      if (typeof mainCourse === 'string' && mainCourse.includes(',')) {
          mainCourse = mainCourse.split(',').map(item => item.trim());
      } else if (typeof mainCourse === 'string' && mainCourse.trim() !== '') {
          mainCourse = [mainCourse.trim()];
      }
      
      if (typeof selectedCourses === 'string' && selectedCourses.includes(',')) {
          selectedCourses = selectedCourses.split(',').map(item => item.trim());
      } else if (typeof selectedCourses === 'string' && selectedCourses.trim() !== '') {
          selectedCourses = [selectedCourses.trim()];
      }
      
      console.log('Parsed mainCourse:', mainCourse);
      console.log('Parsed selectedCourses:', selectedCourses);

      const { topicName, editorContent, date } = req.body;
      
      // First, fetch the existing assignment
      const existingAssignment = await Assignment.findById(assignmentId);
      if (!existingAssignment) {
          return res.status(404).json({ success: false, message: 'Assignment not found' });
      }
      
      // Sanitize the content to ensure it's valid
      let sanitizedContent = editorContent;
      console.log('Original editorContent:', editorContent);
      console.log('Original editorContent type:', typeof editorContent);
      console.log('Original editorContent length:', editorContent ? editorContent.length : 'undefined');
      
      if (typeof sanitizedContent === 'string') {
          // Remove any null bytes or other problematic characters
          sanitizedContent = sanitizedContent.replace(/\0/g, '');
          // Remove other control characters that might cause issues
          sanitizedContent = sanitizedContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
          // Ensure it's not empty after sanitization
          if (sanitizedContent.trim() === '') {
              sanitizedContent = existingAssignment.content || '';
          }
      }
      
      console.log('Sanitized content length:', sanitizedContent ? sanitizedContent.length : 'undefined');
      console.log('Sanitized content type:', typeof sanitizedContent);
      
      console.log('Existing assignment found:', {
          id: existingAssignment._id,
          mainCourse: existingAssignment.mainCourse,
          course: existingAssignment.course,
          topicName: existingAssignment.topicName
      });

      let fileUrl = existingAssignment.thumb; 

      if (req.file) {
          try {
              const fileKey = `user/thumb/${Date.now()}_${req.file.originalname}`;

              const uploadParams = {
                  Bucket: BUCKET_NAME,
                  Key: fileKey,
                  Body: req.file.buffer,
                  ContentType: req.file.mimetype,
              };

              const uploadResponse = await s3.upload(uploadParams).promise();
              fileUrl = `https://imsdata.ifda.in/${fileKey}`;
              console.log('File uploaded successfully:', fileUrl);
          } catch (uploadError) {
              console.error('Error uploading file to S3:', uploadError);
              return res.status(500).json({ 
                  success: false, 
                  message: 'Error uploading file', 
                  error: uploadError.message 
              });
          }
      }

      // Create backup before updating
      try {
          const backupData = { ...existingAssignment.toObject(), originalAssignmentId: existingAssignment._id };
          delete backupData._id;
          await new BackupAssignment(backupData).save();
          console.log('Backup created successfully');
      } catch (backupError) {
          console.error('Error creating backup:', backupError);
          // Continue with update even if backup fails
      }

      // Update the assignment
      const updateData = {
        mainCourse: mainCourse || existingAssignment.mainCourse,
        course: selectedCourses || existingAssignment.course, // Map selectedCourses to course field
        topicName: topicName || existingAssignment.topicName,
        content: sanitizedContent || existingAssignment.content || existingAssignment.editorContent, // Map editorContent to content field
        thumb: fileUrl,
        date: date || existingAssignment.date,
      };
      
      console.log('updateData.content value:', updateData.content);
      console.log('updateData.content type:', typeof updateData.content);
      console.log('updateData.content length:', updateData.content ? updateData.content.length : 'undefined');
      
      // Ensure arrays are properly formatted
      if (Array.isArray(updateData.mainCourse)) {
          updateData.mainCourse = updateData.mainCourse.filter(item => item && item.trim() !== '');
      }
      if (Array.isArray(updateData.course)) {
          updateData.course = updateData.course.filter(item => item && item.trim() !== '');
      }
      
      // Validate required fields
      if (!updateData.mainCourse || updateData.mainCourse.length === 0) {
          console.error('mainCourse is required and cannot be empty');
          return res.status(400).json({ 
              success: false, 
              message: 'mainCourse is required and cannot be empty' 
          });
      }
      
      if (!updateData.course || updateData.course.length === 0) {
          console.error('course is required and cannot be empty');
          return res.status(400).json({ 
              success: false, 
              message: 'course is required and cannot be empty' 
          });
      }
      
      if (!updateData.topicName || updateData.topicName.trim() === '') {
          console.error('topicName is required and cannot be empty');
          return res.status(400).json({ 
              success: false, 
              message: 'topicName is required and cannot be empty' 
          });
      }
      
      if (!updateData.content || updateData.content.trim() === '') {
          console.error('content is required and cannot be empty');
          return res.status(400).json({ 
              success: false, 
              message: 'content is required and cannot be empty' 
          });
      }
      
      // Check content size (MongoDB has a 16MB document limit)
      console.log('Content size check - length:', updateData.content ? updateData.content.length : 'undefined');
      if (updateData.content && updateData.content.length > 16000000) {
          console.error('content is too large (over 16MB)');
          return res.status(400).json({ 
              success: false, 
              message: 'content is too large (over 16MB)' 
          });
      }
      
      console.log('Updating assignment with data:', updateData);
      console.log('Content field value:', updateData.content);
      console.log('Content field type:', typeof updateData.content);
      console.log('Content field length:', updateData.content ? updateData.content.length : 'undefined');
      console.log('Raw editorContent from request:', req.body.editorContent);
      console.log('Raw editorContent type:', typeof req.body.editorContent);
      
      // Additional debugging for content field
      if (updateData.content) {
          console.log('Content field first 200 chars:', updateData.content.substring(0, 200));
          console.log('Content field last 200 chars:', updateData.content.substring(updateData.content.length - 200));
          console.log('Content field contains null bytes:', updateData.content.includes('\0'));
          console.log('Content field contains problematic characters:', /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(updateData.content));
      }
      
      try {
          // Update the assignment fields
          console.log('Before assignment - existingAssignment.content:', existingAssignment.content);
          console.log('Before assignment - updateData.content:', updateData.content);
          
          existingAssignment.mainCourse = updateData.mainCourse;
          existingAssignment.course = updateData.course;
          existingAssignment.topicName = updateData.topicName;
          existingAssignment.content = updateData.content;
          existingAssignment.thumb = updateData.thumb;
          existingAssignment.date = updateData.date;
          
          console.log('After assignment - existingAssignment.content:', existingAssignment.content);
          console.log('Assignment fields updated successfully');
          console.log('Final existingAssignment object before save:', existingAssignment);
      } catch (assignError) {
          console.error('Error assigning data to existing assignment:', assignError);
          return res.status(500).json({ 
              success: false, 
              message: 'Error updating assignment data', 
              error: assignError.message 
          });
      }
      
      try {
          console.log('About to save assignment with content length:', existingAssignment.content ? existingAssignment.content.length : 'undefined');
          const updatedAssignment = await existingAssignment.save();
          console.log('Assignment updated successfully:', updatedAssignment._id);
          
          return res.status(200).json({ 
              success: true, 
              message: 'Assignment updated successfully', 
              data: updatedAssignment 
          });
      } catch (saveError) {
          console.error('Error saving updated assignment:', saveError);
          console.error('Save error name:', saveError.name);
          console.error('Save error message:', saveError.message);
          console.error('Save error stack:', saveError.stack);
          
          if (saveError.name === 'ValidationError') {
              console.error('Validation error details:', saveError.errors);
              return res.status(400).json({ 
                  success: false, 
                  message: 'Validation error', 
                  error: saveError.message 
              });
          }
          throw saveError; // Re-throw to be caught by outer catch block
      }

  } catch (error) {
      console.error('Error updating assignment:', error);
      return res.status(500).json({ 
          success: false, 
          message: 'Error updating assignment', 
          error: error.message 
      });
  }
};

// Get all assignments (with optional pagination)
exports.getAssignments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Pagination parameters
    const assignments = await Assignment.find()
      .populate({ path: 'userId', select: 'name email' });

    const total = await Assignment.countDocuments();
    res.status(200).json({
      success: true,
      data: assignments,
      meta: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching assignments', error: error.message });
  }
};

// Get assignments by multiple topicNames
exports.getAssignmentsByTopics = async (req, res) => {
  try {
    const { courses } = req.query;

    if (!courses) {
      return res.status(400).json({ success: false, message: 'No course names provided' });
    }

    // Step 1: Split and clean input
    const courseArray = courses
      .split(',')
      .map(course => course.trim());

    // Step 2: Create regex array for case-insensitive matching
    const regexArray = courseArray.map(course => new RegExp(`^${course}$`, 'i'));

    console.log('Requested Courses:', courses);

    // Step 3: Query assignments by course (array field)
    const assignments = await Assignment.find({
      $or: regexArray.map(regex => ({ course: { $regex: regex } }))
    }).populate({ path: 'userId', select: 'name email' });

    return res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching assignments by courses',
      error: error.message
    });
  }
};


// Get all assignments for a specific user
exports.getAssignmentsByUserId = async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from route parameters

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Find assignments for the given userId
    const assignments = await Assignment.find({ userId }).populate({
      path: 'userId',
      select: 'name email',
    });

    if (!assignments || assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No assignments found for this user',
      });
    }

    res.status(200).json({
      success: true,
      message: `Assignments for user ${userId} fetched successfully`,
      data: assignments,
    });
  } catch (error) {
    console.error('Error fetching assignments by user:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments',
      error: error.message,
    });
  }
};

// Get a single assignment by ID
exports.getAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId).populate({
      path: 'userId',
      select: 'name email',
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching assignment', error: error.message });
  }
};

// Delete an assignment by ID
exports.deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Find and delete the assignment
    const deletedAssignment = await Assignment.findByIdAndDelete(assignmentId);

    if (!deletedAssignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    res.status(200).json({ success: true, message: 'Assignment deleted successfully', data: deletedAssignment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting assignment', error: error.message });
  }
};


// Restore a backup assignment
exports.restoreAssignment = async (req, res) => {
  try {
    const { backupId } = req.params;

    // Find the backup assignment
    const backupAssignment = await BackupAssignment.findById(backupId);
    if (!backupAssignment) {
      return res.status(404).json({ success: false, message: 'Backup assignment not found' });
    }

    // Remove old _id to avoid conflict and create a new one
    const restoredData = backupAssignment.toObject();
    delete restoredData._id;

    const restoredAssignment = new Assignment(restoredData);
    await restoredAssignment.save();

    res.status(200).json({
      success: true,
      message: 'Backup assignment restored successfully',
      data: restoredAssignment,
    });
  } catch (error) {
    console.error('Error restoring assignment:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error restoring assignment',
      error: error.message,
    });
  }
};
