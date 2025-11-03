const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    taskName: {
      type: String,
      required: true,
      trim: true,
    },
    faculty_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the Faculty model
      required: true,
    },
    branches: {
      type: [String],
      required: true,
    },
    courses: {
      type: [
        {
          value: String,
          label: String,
        },
      ],
      required: true,
    },
    students: [
      {
        student_id: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        file: {
          type: String,
        },
        grade: {
          type: String,
          default: null,
        },
        status: {
          type: String,
          enum: ['Done', 'Pending'],
          default: 'Pending',
        },
      },
    ],
    description: {
      type: String,
      default: '',
    },
    filePath: {
      type: String,
    },
    targetDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Project', ProjectSchema);
