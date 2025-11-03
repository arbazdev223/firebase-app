const mongoose = require('mongoose');

// Flexible schema so new sections/questions can be inserted by data only changes.
const questionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    prompt: { type: String, required: true, trim: true },
    responseType: {
      type: String,
      enum: ['rating', 'scale', 'text', 'longText', 'boolean', 'dropdown', 'multiSelect'],
      default: 'rating',
    },
    scaleMin: { type: Number, default: 1 },
    scaleMax: { type: Number, default: 5 },
    options: { type: [String], default: [] },
    isRequired: { type: Boolean, default: true },
    response: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
    questions: { type: [questionSchema], default: [] },
  },
  { _id: false }
);

const finalStudentFeedbackSchema = new mongoose.Schema(
  {
    basicDetails: {
      studentId: { type: String, required: true, trim: true },
      studentName: { type: String, required: true, trim: true },
      courseName: { type: String, required: true, trim: true },
      trainerName: { type: String, required: true, trim: true },
      batchTiming: { type: String, required: true, trim: true },
      learningMode: {
        type: String,
        required: true,
        enum: ['Offline', 'Online', 'Hybrid'],
        trim: true,
      },
      courseDuration: { type: String, default: '', trim: true },
      feedbackDate: { type: Date, required: true },
    },
    sections: { type: [sectionSchema], default: [] },
    metadata: {
      templateVersion: { type: String, default: '1.0.0', trim: true },
      submittedBy: { type: String, default: '', trim: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FinalStudentFeedback', finalStudentFeedbackSchema);
