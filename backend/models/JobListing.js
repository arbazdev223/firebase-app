const mongoose = require('mongoose');

const jobListingSchema = new mongoose.Schema({
  leadRelevant: {
    type: String,
    enum: ["Relevant", "Not Relevant"],
    default: null,
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  location: {
    type: [String],
    required: true
  },
  experience: {
    type: String
  },
  job_post_day: {
    type: String
  },
  salary: {
    type: String
  },
  phone: {
    type: String
  },
  job_link: {
    type: String,
    required: true,
    unique: true 
  },
  calling_date: {
    type: Date
  },
  remark: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('JobListing', jobListingSchema);