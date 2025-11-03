const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for storing FAQ information
const FaqsSchema = new Schema(
  {
    topicName: {
      type: String,
      required: true,
    },
    selectedTeams: {
      type: [String], 
      required: true,
    },
    Category: {
      type: Schema.Types.ObjectId, 
      ref: 'Category',
      required: true,
    },
    selectedMembers: { // Updated to match the JSON
      type: [Schema.Types.ObjectId],
      ref: 'User', // Reference to the User model
      required: true,
    },
    for: {
      type: String,
      enum: ['Faq', 'script'],
      required: true,
    },
    editorContent: {
      type: String, // Updated from Object to String to match JSON format
      required: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Create and export the model based on the schema
const Faqs = mongoose.model('Faqs', FaqsSchema);
module.exports = Faqs;
