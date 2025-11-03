const Project = require('../models/Project');

const createProject = async (req, res) => {
  try {
    console.log("🔥 Reached createProject");
    console.log("📦 Request body:", req.body);
    console.log("👤 User:", req.body.user); // This will now log the entire user object

    const { name, description, members, icon, bg, status, deadline, user } = req.body;

    // Ensure that user object is present and has the necessary data
    if (!user || !user._id) {
      return res.status(400).json({ msg: 'User data is missing or invalid' });
    }

    if (!members || members.length === 0) {
      return res.status(400).json({ msg: 'At least one member is required' });
    }

    const project = await Project.create({
      name,
      description,
      members,
      createdBy: user._id, // You can now use the full user object
      icon,
      bg,
      status,
      deadline,
    });

    req.io?.emit('projectCreated', project);

    res.status(201).json(project);
  } catch (err) {
    console.error("❌ Error creating project:", err);
    res.status(500).json({ msg: 'Project creation failed', error: err.message });
  }
};

const getProjects = async (req, res) => {
  try {
    // You can still verify the user if needed
    // if (!req.user) {
    //   return res.status(401).json({ msg: 'Not authorized' });
    // }

    const projects = await Project.find().populate('members', 'name email');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch projects', error: err.message });
  }
};

const updateProject = async (req, res) => {
  try {
    // Ensure the user is authenticated and authorized (for example, check if they are the creator)
    if (!req.user) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { name, description, members } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user is authorized to update this project (e.g., check creator)
    if (project.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'manager') {
      return res.status(403).json({ msg: 'Forbidden: You do not have permission to update this project' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, members },
      { new: true }
    );

    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to update project', error: err.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    // Ensure the user is authenticated and authorized
    if (!req.user) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user is authorized to delete this project
    if (project.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'manager') {
      return res.status(403).json({ msg: 'Forbidden: You do not have permission to delete this project' });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to delete project', error: err.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
};
