const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for CircularNotification
const CircularNotificationSchema = new Schema(
  {
    topicHeading: {
      type: String,
      required: true,
    },
    shareMembers: {
      type: String,
      enum: ['All', 'Student', 'Faculty', 'Counsellor', 'Tellecaller', 'HR', 'IT', 'Backend'],
      required: true,
    },
    branch: {
      type: String,
      enum: ['Both', 'Kalkaji', 'Badarpur'],
      required: true,
    },
    circular: {
      type: String,
      enum: ['Both', 'Tips', 'Circular'],
      required: true,
    },
    content: {
      type: String,  // Storing HTML content from ReactQuill editor
      required: true,
    },
  },
  {
    timestamps: true,  // Automatically adds createdAt and updatedAt fields
  }
);

// Create and export the model based on the schema
const CircularNotification = mongoose.model('CircularNotification', CircularNotificationSchema);
module.exports = CircularNotification;
