const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enqure",
      unique: true,
      default: null,
    },
    counsellor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    course: {
      type: [String],
      default: [],
    },
    registrationAmount: {
      type: Number,
      default: null,
    },
    paymentDate: [{ type: Date }],
    receipt: {
      type: [String],
      default: [],
    },
    admissionDate: {
      type: Date,
      default: null,
    },
    totalAmount: {
      type: String,
      default: null,
    },
    admissionAmount: {
      type: Number,
      default: null,
    },
    receivedAmount: {
      type: String,
      default: null,
    },
    remainingAmount: {
      type: String,
      default: null,
    },
    remark: {
      type: String,
      default: null,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Done", "Pending"],
      default: null,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Registration', RegistrationSchema);