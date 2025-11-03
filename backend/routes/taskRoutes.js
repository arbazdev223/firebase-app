const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const taskControllers = require('../controllers/taskControllers');
const multer = require('multer');
const storage = multer.memoryStorage(); // ✅ Change to memoryStorage for S3 upload
const upload = multer({ storage: multer.memoryStorage() });

// Route for creating a new task
router.post('/tasks', upload.single('thumb'), taskController.createTask);

// Route for fetching all tasks
router.get('/tasks', taskController.getAllTasks);

// Route for fetching a task by its ID
router.get('/tasks/:id', taskController.getTaskById);

// Route for updating a task
router.put('/tasks/:id', taskController.updateTask);

// Route for deleting a task
router.delete('/tasks/:id', taskController.deleteTask);


router.post('/', taskControllers.createTask);
router.get('/', taskControllers.getAllTasks);
router.get('/:id', taskControllers.getTaskById);
router.put('/:id', taskControllers.updateTask);
router.delete('/:id', taskControllers.deleteTask);

module.exports = router;
