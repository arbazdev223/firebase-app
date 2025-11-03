const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true, trim: true },
    options: {
      type: [optionSchema],
      validate: {
        validator: (options) => Array.isArray(options) && options.length >= 2 && options.length <= 6,
        message: 'Each question must have between 2 and 6 options.',
      },
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (index) {
          return Array.isArray(this.options) && index < this.options.length;
        },
        message: 'correctOptionIndex must reference an existing option.',
      },
    },
    explanation: { type: String, trim: true, default: '' },
  },
  { timestamps: false }
);

const courseMcqTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    courseName: { type: String, required: true, trim: true },
    courseCode: { type: String, trim: true, default: '' },
    passPercentage: { type: Number, default: 70, min: 0, max: 100 },
    durationMinutes: { type: Number, min: 0, default: 0 },
    maxAttemptsPerStudent: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    questions: { type: [questionSchema], default: [] },
    metadata: {
      createdBy: { type: String, trim: true, default: '' },
      tags: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CourseMcqTest', courseMcqTestSchema);
