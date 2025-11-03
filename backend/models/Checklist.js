const mongoose = require('mongoose');

const checklistSchema = new mongoose.Schema({
  task_name: {
    type: String,
    required: true,
    trim: true,
  },
  frequency: {
    type: String,
    default: null,
  },
  department: {
    type: [String], // Array of strings for multiple departments
    default: null,
    validate: {
      validator: function (arr) {
        return arr === null || arr.length > 0;
      },
      message: 'Department must be null or a non-empty array.',
    },
  },
  main_base: {
    type: String,
    default: null,
  },
  weightage: {
    type: Number,
    default: null,
    min: 0,
  },
  adhoc_task: {
    type: String,
    default: null,
  },
});

const Checklist = mongoose.model('Checklist', checklistSchema);

module.exports = Checklist;
