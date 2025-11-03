const mongoose = require('mongoose');

// Define remark schema
const remarkSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    Status: {
        type: String,
        default: null
    },
    remark: {
        type: String,
        default: null
    }
}, { timestamps: true });

// Define training schema
const trainingDetailsSchema = new mongoose.Schema({
    TrainingDate: {
        type: String,
    },
    remark: {
        type: String,
    }
});

const trainingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    TrainingStart: {
        type: String,
        default: null
    },
    TrainingEnd: {
        type: String,
        default: null
    },
    TrainingDetails: [trainingDetailsSchema] // Array of training details
}, { timestamps: true });

// Define candidate schema
const candidateSchema = new mongoose.Schema({
    relevent: {
        type: String,
        enum: ['Relevant', 'Not Relevant', 'Lineup'],
        required: true
    },
    source: {
        type: String,
        required: true
    },
    Reference: {
        type: String,
    },
    file: {
        type: String
    },
    name: {
        type: String,
        required: true
    },
    candidatePrfileURL: {
        type: String,
    },
    candidatePhone: {
        type: String,
    },
    candidateEmail: {
        type: String,
    },
    candidateProfile: {
        type: String,
    },
    candidateLocation: {
        type: String,
    },
    candidateExperience: {
        type: String,
    },
    currentSalary: {
        type: String,
    },
    candidateExpected: {
        type: String,
    },
    reason: {
        type: String,
    },
    candidateQualification: {
        type: String,
    },
    candidateNoticePeriod: {
        type: String,
    },
    cvReceived: {
        type: String,
        enum: ['Received', 'Not Received'],
        default: null
    },
    interviewerName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    interviewDate: {
        type: Date
    },
    followUpDate: {
        type: Date,
        default: null
    },
    interviewStatus: {
        type: String,
        default: null
    },
    edoj: {
        type: Date,
        default: null
    },
    remarks: [remarkSchema], // Use remark schema as a nested field
    training: trainingSchema // Include the training schema if needed
}, { timestamps: true });

// Create and export the Candidate model
const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;
