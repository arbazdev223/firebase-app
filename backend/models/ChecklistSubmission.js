const mongoose = require('mongoose');

const checklistSubmissionSchema = new mongoose.Schema({
  user: {
    type: Object, // Store user info (id, name, department, etc.)
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  tasks: [
    {
      task_name: String,
      frequency: String,
      department: [String],
      main_base: String,
      weightage: Number,
      adhoc_task: String,
      startTime: String,
      endTime: String,
      gap: mongoose.Schema.Types.Mixed, // number or ""
      option: String,
      presentCount: Number,
      absentCount: Number,
      additionalWork: String,
    }
  ]
});

const ChecklistSubmission = mongoose.model('ChecklistSubmission', checklistSubmissionSchema);

module.exports = ChecklistSubmission; 