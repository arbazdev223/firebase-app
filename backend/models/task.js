const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  assignedUser:  { type: String,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true },
    selectedMembers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  priority: {
    type: String,
  },
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
  Comment: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('userTask', TaskSchema);
