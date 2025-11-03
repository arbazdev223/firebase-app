const mongoose = require('mongoose');

// Apply Leave Schema
const applyLeaveSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }, // Connects to User
  leaveType: {
    type: String, 
    enum: ['PL', 'SL', 'CL'], // Added CL: Casual Leave
    required: true
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  reason: { 
    type: String, 
    required: true,
    trim: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  file: { 
    type: String,
    default: null  
  },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  }, // Tracks who approved/rejected the leave
  appliedAt: { 
    type: Date, 
    default: Date.now 
  },
  comments: { 
    type: String, 
    trim: true,
    default: null 
  }
}, { timestamps: true }); // Adds createdAt & updatedAt fields

module.exports = mongoose.model('ApplyLeave', applyLeaveSchema);
