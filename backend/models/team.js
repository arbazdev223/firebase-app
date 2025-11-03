const mongoose = require('mongoose');

// Assuming the User model is already created and exported
const User = require('./User'); // Adjust the path as needed

const teamSchema = new mongoose.Schema({
  team_name: { 
    type: String, 
    required: true 
  },
  users: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Reference to the 'User' model
    required: true 
  }],
});

module.exports = mongoose.model('Team', teamSchema);