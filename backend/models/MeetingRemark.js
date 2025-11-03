const mongoose = require('mongoose');
const { Schema } = mongoose;

// Assuming you have a User model defined elsewhere in your project
const meetingRemarkSchema = new Schema({
  selectedTeams: {
    type: [String], // Array of team ids or names selected
    required: true,
    validate: {
      validator: function(value) {
        return value.length > 0; // Ensure at least one team is selected
      },
      message: 'At least one team must be selected.'
    }
  },
  selectedMembers: [{
    type: mongoose.Schema.Types.ObjectId, // Reference to the User model
    ref: 'User', // The name of the referenced model (User)
    required: true,
  }],
  stars: {
    type: String,
    enum: ['1 Stars', '2 Stars', '3 Stars', '4 Stars', '5 Stars', 'NA'], // Enum for star ratings
    default: 'NA'
  },
  editorContent: {
    type: String,
    required: true, // The content from the ReactQuill editor
  },
  createdAt: {
    type: Date,
    default: Date.now, // Timestamp when the remark was created
  },
  updatedAt: {
    type: Date,
    default: Date.now, // Timestamp when the remark was last updated
  },
});

// Middleware to update `updatedAt` when modified
meetingRemarkSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const MeetingRemark = mongoose.model('MeetingRemark', meetingRemarkSchema);

module.exports = MeetingRemark;
