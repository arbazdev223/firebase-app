const express = require('express');
const router = express.Router();
const AssignmentController = require('../controllers/AssignmentController');
const multer = require('multer');
const storage = multer.memoryStorage(); // ✅ Change to memoryStorage for S3 upload
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fieldSize: 50 * 1024 * 1024, // 50MB for field values (like editorContent)
        fileSize: 10 * 1024 * 1024,  // 10MB for file uploads
        fields: 10,                   // Maximum number of fields
        files: 1,                     // Maximum number of files
        parts: 20                     // Maximum number of parts (fields + files)
    }
});

// Multer configuration for file uploads
// Create a new assignment
router.post('/assignments', upload.single('thumb'), AssignmentController.createAssignment);

// Update an existing assignment
router.put('/assignments/:assignmentId', upload.single('thumb'), AssignmentController.updateAssignment);

// Get all assignments
router.get('/assignments', AssignmentController.getAssignments);

router.get('/assignments/by-topics', AssignmentController.getAssignmentsByTopics);

// Get a single assignment by ID
router.get('/assignments/:assignmentId', AssignmentController.getAssignmentById);

// Delete an assignment
router.delete('/assignments/:assignmentId', AssignmentController.deleteAssignment);

// Get assignments by user ID
router.get('/assignments/user/:userId', AssignmentController.getAssignmentsByUserId);

router.post('/restore-assignment/:backupId', AssignmentController.restoreAssignment);

module.exports = router;