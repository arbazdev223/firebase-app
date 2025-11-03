const Bachecalls = require('../models/bachecalls');

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const newTask = new Bachecalls(req.body);
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ message: 'Error creating task', error });
  }
};

// Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
  console.log('GET /api/bachecalls reached');
    const tasks = await Bachecalls.find().populate('faculty_id');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Bachecalls.findById(req.params.id).populate('faculty_id');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const updated = await Bachecalls.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Error updating task', error });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const deleted = await Bachecalls.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error });
  }
};
