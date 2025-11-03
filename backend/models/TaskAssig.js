const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  assignedUser:  { type: String, required: true },
  selectedStudent: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'studentinfo',
    }
  ],
  taskName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  targetDate: {
    type: Date,
    required: true,
  },
  editorContent: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
