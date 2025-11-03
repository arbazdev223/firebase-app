const Task = require('../models/TaskAssig');

// Controller for creating a new task
exports.createTask = async (req, res) => {
  try {
    const { assignedUser, selectedStudent, taskName, status, targetDate, editorContent } = req.body;

    const newTask = new Task({
      assignedUser,
      selectedStudent,
      taskName,
      status,
      targetDate,
      editorContent,
    });

    if (req.file) {
      // If there's an uploaded file (thumb), you can process it here, like uploading to S3
      newTask.thumb = req.file.buffer;
    }

    await newTask.save();
    res.status(201).json({ message: 'Task created successfully', task: newTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create task', error });
  }
};


// Controller for fetching all tasks
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate('selectedStudent');
    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch tasks', error });
  }
};

// Controller for fetching a task by its ID
exports.getTaskById = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findById(id).populate('selectedStudent');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch task', error });
  }
};

// Controller for updating a task
exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { assignedUser, selectedStudent, taskName, status, targetDate, editorContent } = req.body;

  try {
    const updatedTask = await Task.findByIdAndUpdate(id, {
      assignedUser,
      selectedStudent,
      taskName,
      status,
      targetDate,
      editorContent,
    }, { new: true });

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update task', error });
  }
};

// Controller for deleting a task
exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete task', error });
  }
};
