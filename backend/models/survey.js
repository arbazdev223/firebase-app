const mongoose = require('mongoose');

// Question schema for individual questions
const questionSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  question: { type: String, required: true },
  type: { type: String, required: true, enum: ['rating', 'yes/no', 'dropdown', 'text'] },
  scale: { type: [Number], default: [1, 2, 3, 4, 5] },  // For rating questions
  options: { type: [String], default: [] },  // For dropdown or yes/no questions
  isRequired: { type: Boolean, default: true },  // Marks question as mandatory
});

// Survey schema to hold multiple months or sections
const surveySchema = new mongoose.Schema({
  title: { type: String, required: true },  // Survey title
  description: { type: String, default: '' },  // Survey description
  month: { type: String, required: true },  // Identifies which month the survey belongs to
  questions: [questionSchema],  // Questions related to the survey
  createdAt: { type: Date, default: Date.now },  // Timestamp of creation
  updatedAt: { type: Date, default: Date.now },  // Timestamp of last update
});



// Export the models using named exports
module.exports = mongoose.model("Survey", surveySchema);

