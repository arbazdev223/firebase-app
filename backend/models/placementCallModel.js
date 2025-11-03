const mongoose = require('mongoose');

const placementCallSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  jobProfile: {
    type: String,
    required: true,
    trim: true,
  },
  companyAddress: {
    type: String,
    required: true,
    trim: true,
  },
  experienceRequired: {
    type: String, // Example: "0-2 years", "Fresher", etc.
    required: true,
  },
  numberOfCandidates: {
    type: Number,
    required: true,
    min: 1,
  },
  connectedPerson: {
    name: { type: String, required: true },
    designation: { type: String },
    phone: { type: String },
    email: { type: String },
  },
  salaryOrStipend: {
    amount: { type: String, required: true }, // Example: "?15,000", "Negotiable", "?25,000 - ?30,000"
    type: { type: String, enum: ['Salary', 'Stipend'], required: true },
  },
  datePosted: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model('PlacementCall', placementCallSchema);
