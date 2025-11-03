const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    icon: {
        type: String,
        required: true,
    },
    bg: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'on_hold'],
        default: 'active'
      },
      deadline: Date
      
  },
  { timestamps: true }
);

module.exports = mongoose.model('userProject', projectSchema);
