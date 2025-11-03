const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOptionIndex: { type: Number, min: 0, required: true },
    isCorrect: { type: Boolean, required: true },
    correctOptionIndex: { type: Number, min: 0, required: true },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseMcqTest', required: true },
    studentId: { type: String, required: true, trim: true },
    studentName: { type: String, required: true, trim: true },
    batchName: { type: String, trim: true, default: '' },
    courseName: { type: String, trim: true, default: '' },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: Date.now },
    totalQuestions: { type: Number, required: true },
    totalCorrect: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passPercentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    responses: { type: [responseSchema], default: [] },
    remarks: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CourseMcqAttempt', attemptSchema);
