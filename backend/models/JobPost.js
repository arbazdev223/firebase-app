const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: true,
    },
    file: {
      type: String,
    },
    companyName: {
      type: String,
      required: true,
    },
    jobLocation: {
      type: String,
      required: true,
    },
    jobType: {
      type: String,
      enum: ['Full Time', 'Part Time', 'Internship'],
      default: 'NA',
    },
    jobProfile: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      enum: ['Fresher', 'Intern', '0-1 year', '1-2 year', '2-3 year', '3-4 year', '4-5 year'],
      default: 'NA',
    },
    qualification: {
      type: String,
      enum: ['10th', '12th', 'Graduate', 'Certification', 'Post Graduate', 'Diploma', 'Any'],
      default: 'Any',
    },
    closingDate: {
      type: Date, 
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const JobPost = mongoose.model('JobPost', jobPostSchema);

module.exports = JobPost;
