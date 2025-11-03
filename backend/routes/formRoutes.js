const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');

// Create a new form
router.post('/', formController.createForm);

// Get all forms
router.get('/', formController.getAllForms);

// Get a form by ID
router.get('/:id', formController.getFormById);

// Update a form by ID
router.put('/:id', formController.updateForm);

module.exports = router;
