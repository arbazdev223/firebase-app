const mongoose = require('mongoose');
const User = require('./User');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  rightAnswer: { type: String, required: true }
});

const testSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: {
      type: [String],
      required: true,
    },
    thumb: {
      type: String,
      default: null,
    },
    module: {
      type: String,
      required: true,
    },
    questions: [questionSchema],
  },
  { timestamps: true }
);

const Test = mongoose.model('Test', testSchema);

module.exports = Test;
