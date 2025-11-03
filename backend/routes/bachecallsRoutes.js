const express = require('express');
const router = express.Router();
const bachecallsController = require('../controllers/bachecallsController');

// Debug log
console.log("? bachecallsRoutes loaded");

// RESTful routes
router.get('/', (req, res) => {
  console.log("? /api/bachecalls hit");
  res.json({ message: "Bachecalls route is working" });
});

// Get all bachecalls
router.get('/all', bachecallsController.getAllTasks);

// Individual bachecalls routes
router.post('/', bachecallsController.createTask);
router.get('/:id', bachecallsController.getTaskById);
router.put('/:id', bachecallsController.updateTask);
router.delete('/:id', bachecallsController.deleteTask);

module.exports = router;
