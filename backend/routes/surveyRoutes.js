const express = require('express');
const surveyController = require('../controllers/surveyController');

const router = express.Router();

// Create a survey
router.post('/', surveyController.createSurvey);

// Get all surveys
router.get('/', surveyController.getAllSurveys);

// Get a survey by ID
router.get('/:id', surveyController.getSurveyById);

// Update a survey
router.put('/:id', surveyController.updateSurvey);

// Delete a survey
router.delete('/:id', surveyController.deleteSurvey);

module.exports = router;
