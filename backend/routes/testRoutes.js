const express = require('express');
const router = express.Router();
const TestController = require('../controllers/TestController');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Middleware for validating test creation
const validateCreateTest = (req, res, next) => {
  const { userId, course, module, questions } = req.body;
  if (!userId || !course || !module || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid input data' });
  }
  next();
};

// Middleware for validating :id parameter
router.param('id', (req, res, next, id) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) { // MongoDB ObjectId validation
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  next();
});

// Routes for tests
router.post('/', upload.single('thumb'), validateCreateTest, TestController.createTest); // Create a new test
router.get('/', TestController.getAllTests); // Get all tests
router.get('/by-module', TestController.getTestsByModule); // Get all tests
router.get('/:id', TestController.getTestById); // Get a test by ID
router.put('/:id', upload.single('thumb'), TestController.updateTest); // Update a test
router.delete('/:id', TestController.deleteTest);
// Fallback for invalid routes
router.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = router;
