const Survey = require('../models/survey');

// Create a new survey
module.exports.createSurvey = async (req, res) => {
  try {
    const survey = new Survey(req.body);
    const savedSurvey = await survey.save();
    res.status(201).json(savedSurvey);
  } catch (error) {
    console.error(error);  // Log the error for debugging purposes
    res.status(500).json({ message: 'Failed to create survey', error: error.message });
  }
};

// Get all surveys
module.exports.getAllSurveys = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: 'Month is required in query parameter' });
    }

    const survey = await Survey.findOne({ month });

    console.log('Requested month:', month);
    console.log('Survey from backend:', survey);

    if (!survey) {
      return res.status(404).json({ error: `Survey not found for ${month}` });
    }

    res.json(survey);
  } catch (error) {
    console.error('Error fetching survey:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get a survey by ID
module.exports.getSurveyById = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    res.status(200).json(survey);
  } catch (error) {
    console.error(error);  // Log the error for debugging purposes
    res.status(500).json({ message: 'Failed to retrieve survey', error: error.message });
  }
};

// Update a survey
module.exports.updateSurvey = async (req, res) => {
  try {
    const updatedSurvey = await Survey.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }  // Added runValidators to ensure validation runs on update
    );
    if (!updatedSurvey) return res.status(404).json({ message: 'Survey not found' });
    res.status(200).json(updatedSurvey);
  } catch (error) {
    console.error(error);  // Log the error for debugging purposes
    res.status(400).json({ message: 'Failed to update survey', error: error.message });
  }
};

// Delete a survey
module.exports.deleteSurvey = async (req, res) => {
  try {
    const deletedSurvey = await Survey.findByIdAndDelete(req.params.id);
    if (!deletedSurvey) return res.status(404).json({ message: 'Survey not found' });
    res.status(200).json({ message: 'Survey deleted successfully' });
  } catch (error) {
    console.error(error);  // Log the error for debugging purposes
    res.status(500).json({ message: 'Failed to delete survey', error: error.message });
  }
};
