const mongoose = require('mongoose');

// Remark Schema
const RemarkSchema = new mongoose.Schema({
  conversionRate: { type: String,  },
  response: { type: String,  },
  formType: { type: String,  },
  department: { type: String,  },
  remarks: { type: String,  },
}, { timestamps: true });

// Enquiry Schema
const RecordBackupSchema  = new mongoose.Schema(
  {
    dataId: {
      type: String,
    },
    leadStatus: {
      type: String,
    },
    source: {
      type: String,
    },
    caller: {
      type: String,
    },
    studentName: {
      type: String,
    },
    fatherName: {
      type: String,
    },
    studentMobile: {
      type: String,
    },
    studentAltNumber: {
      type: String,
    },
    school: {
      type: String,
    },
    pincode: {
      type: String,
    },
    location: {
      type: String,
    },
    leadRelevant: {
      type: String,

    },
    callingDate: {
      type: Date,
    },
    assign: {
      type: String,
    },
    visitDate: {
      type: Date,
      default: null,
    },
    visit: {
      type: String,
    },
    parentStatus: {
      type: String,
    },
    studentMessage: {
      type: String,
    },
    registrationDate: {
      type: Date,
    },
    registrationAmount: {
      type: Number,
    },
    admissionDate: {
      type: Date,
    },
    admissionAmount: {
      type: Number,
    },

    numberInstallment: {
      type: Number,
    },
    ModeofPayment: {
      type: String,
    },
    installmentAmount: {
      type: Number,
    },
    totalFees: {
      type: Number,
    },
    courseType: {
      type: String,
    },
    course: {
      type: [String],
    },
    offer: {
      type: String,
    },
    counsellor: {
      type: String,
    },
    branch: {
      type: String,
    },
    nextFollowUpDate: {
      type: Date,
    },
    todayFollowUpDate: {
      type: Date,
    },
    enquiryType: {
      type: String,
    },
    enquiryDate: {
      type: Date,

    },
    calledStatus: {
      type: String,
    },
    remarks: [RemarkSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecordBackup', RecordBackupSchema);