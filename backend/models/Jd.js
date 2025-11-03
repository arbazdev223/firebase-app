const mongoose = require('mongoose');

// Apply Leave Schema
const JdSchema = new mongoose.Schema({
  Jdname: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String,
    required: true 
  }
});

module.exports = mongoose.model('Jd', JdSchema);
