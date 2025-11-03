const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/ProjectController');

// Create a new task
router.post('/tasks', ProjectController.createTask);

// Get all tasks
router.get('/tasks', ProjectController.getAllTasks);

// Get a single task by ID
router.get('/tasks/:id', ProjectController.getTaskById);

// Update a task by ID
router.put('/tasks/:id', ProjectController.updateTask);

module.exports = router;
