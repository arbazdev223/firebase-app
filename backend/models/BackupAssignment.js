const mongoose = require('mongoose');

const backupAssignmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mainCourse: { type: [String], required: true },
    course: { type: [String], default: [] }, // Stores selected course values as an array of strings
    topicName: { type: String, required: true },
    content: { type: String, required: true }, // HTML string for the editor content
    originalAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BackupAssignment', backupAssignmentSchema);
