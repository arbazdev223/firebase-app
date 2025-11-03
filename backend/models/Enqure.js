const mongoose = require('mongoose');

// Helper function to capitalize a string
const capitalize = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

// Full name validator
const fullNameValidator = (name, source) => {
  if (!["Web Lead", "DTSE"].includes(source)) {  // Allow single names for DTSE
    const nameParts = name.trim().split(' ');
    return nameParts.length >= 2 || /^[A-Z]+\./i.test(name);
  }
  return true;
};

// Remark Schema
const RemarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', },
  conversionRate: { type: String,  },
  response: { type: String, },
  formType: { type: String, },
  department: { type: String, },
  remarks: { type: String, },
}, { timestamps: true });

// Enquiry Schema
const EnqureSchema = new mongoose.Schema(
  {
    leadStatus: {
      type: String,
      enum: ["Hot", "Warm", "Cold"],
    },
    source_type: {
      type: String,
      default: null,
    },
    source: {
      type: String,
      required: true,
      enum: ["Board-Banner-Brochure", "DTSE", "DM", "GMB", "Indoor", "SOL", "Other Reference", "Student Reference", "Web Lead", "Whatsapp API-Brodcast", "Whatsapp API-Web", "Update Course", "Google IVR", "Double Tick"],
    },
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    studentName: {
      type: String,
      // required: true,
      // validate: {
      //   validator: function (value) {
      //     return fullNameValidator(value, this.source);
      //   },
      //   message: 'Student name must include both first and last name unless source is "Web Lead".',
      // },
    },
    fatherName: {
      type: String,
      default: null,
    },
    FatherOccupation: {
      type: String,
      default: null,
    },
    motherName: {
      type: String,
      default: null,
    },
    studentMobile: {
      type: String,
      required: true,
      // validate: {
      //   validator: (value) => /^\d{10}$/.test(value),
      //   message: 'Invalid mobile number. Must be 10 digits.',
      // },
    },
    studentAltNumber: {
      type: String,
      default: null,
    },
    school: {
      type: String,
      default: null,
    },
    class: {
      type: String,
      default: null,
    },
    Stream: {
      type: String,
      default: null,
    },
    Section: {
      type: String,
      default: null,
    },
    pincode: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      default: null,
      // set: capitalize,
    },
    Landmark: {
      type: String,
      default: null,
      // set: capitalize,
    },
    leadRelevant: {
      type: String,
      enum: ["Relevant", "Not Relevant"],
      default: null,
    },
    callingDate: {
      type: Date,
      default: null,
    },
    assign: {
      type: String,
      enum: ["Assigned", "ReAssigned", "Delete"],
      default: null,
    },
    visitDate: {
      type: Date,
      default: null,
    },
    visit: {
      type: String,
      enum: ["Visited", "Not Visited"],
      default: null,
    },
    parentStatus: {
      type: String,
      enum: ["With parents", "Without parents", "Only parents"],
      default: null,
    },
    studentMessage: {
      type: String,
      default: null,
      set: capitalize,
    },
    registrationDate: {
      type: Date,
      default: null,
    },
    registrationAmount: {
      type: Number,
      default: null,
    },
    admissionDate: {
      type: Date,
      default: null,
    },
    admissionAmount: {
      type: Number,
      default: null,
    },

    numberInstallment: {
      type: Number,
      default: null,
    },
    ModeofPayment: {
      type: String,
      default: null,
    },
    installmentAmount: {
      type: Number,
      default: null,
    },
    totalFees: {
      type: Number,
      default: null,
    },
    courseType: {
      type: String,
      default: null,
    },
    course: {
      type: [String],
      default: null,
    },
    offer: {
      type: String,
      enum: ["With", "Without", "Student Kit", "Computer"],
      default: null,
    },
    counsellor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    branch: {
      type: String,
      enum: ["Badarpur", "Kalkaji"],
      default: null,
    },
    nextFollowUpDate: {
      type: Date,
      default: null,
    },
    todayFollowUpDate: {
      type: Date,
      default: null,
    },
    enquiryType: {
      type: String,
      enum: ["Admission", "Drop", "Registration", "WIP"],
      default: null,
    },
    enquiryDate: {
      type: Date,
      default: null,
    },
    calledStatus: {
      type: String,
      enum: ["On Time", "Late"],
      default: null,
    },
    remarks: [RemarkSchema],
  },
  { timestamps: true }
);

EnqureSchema.pre('save', function (next) {
  // Only set enquiryDate if it is completely undefined
  if (this.enquiryDate === undefined) {
    this.enquiryDate = new Date();
  }
  next();
});


// Add compound index for unique constraints
EnqureSchema.index(
  { studentName: 1, fatherName: 1, studentMobile: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

module.exports = mongoose.model('Enqure', EnqureSchema);