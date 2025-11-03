const Form = require('../models/FormField');

// Create a new form
exports.createForm = async (req, res) => {
  try {
    const form = new Form(req.body); // req.body should contain form data
    await form.save();
    res.status(201).json({ message: 'Form created successfully', form });
  } catch (err) {
    res.status(400).json({ message: 'Error creating form', error: err.message });
  }
};

// Get all forms
exports.getAllForms = async (req, res) => {
  try {
    const forms = await Form.find();
    res.status(200).json(forms);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching forms', error: err.message });
  }
};

// Get a single form by ID
exports.getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    res.status(200).json(form);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching form', error: err.message });
  }
};

// Update a form by ID
exports.updateForm = async (req, res) => {
  try {
    const form = await Form.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    res.status(200).json({ message: 'Form updated successfully', form });
  } catch (err) {
    res.status(400).json({ message: 'Error updating form', error: err.message });
  }
};