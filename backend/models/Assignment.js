const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumb: {
    type: String,
    default: null,
  },
  mainCourse: { type: [String], required: true },
  course: { type: [String], required: true },
  topicName: { type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
