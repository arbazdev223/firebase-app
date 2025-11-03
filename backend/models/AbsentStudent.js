const mongoose = require('mongoose');

const AbsentStudentSchema = new mongoose.Schema({
  registration_number: { type: String, required: true },
  faculty_name: { type: String, required: true },
  comment: { type: [String] },
  status: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Absent', AbsentStudentSchema);
