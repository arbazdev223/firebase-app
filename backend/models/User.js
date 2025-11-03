const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    user_code: {
      type: String,
      required: true,
      unique: true,
    },
    thumb: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    fatherName: {
      type: String,
      default: null,
    },
    dob: {
      type: Date,
      default: null,
    },
    doj: {
      type: Date,
      default: null,
    },
    address: {
      type: String,
      lowercase: true,
    },
    phone_number: {
      type: String,
      default: null,
      match: [/^\d{10}$/, "Phone number must be 10 digits"],
    },
    role: {
      type: String,
      enum: ['manager', 'developer', 'tester', 'order', 'admin'],
      default: 'developer',
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Invalid email format"],
    },
    password: {
      type: String,
      required: true, 
      minlength: 6,
    },
    aadhar_no: {
      type: String,
      default: null,
      match: [/^\d{12}$/, "Aadhar number must be 12 digits"],
    },
    pan_card_no: {
      type: String,
      default: null,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN card number format"],
    },
    designation: {
      type: String,
      default: null,
    },
    appraisal_date: {
      type: Date,
      default: null,
    },
    maritalStatus: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      default: null,
    },
    work_on: {
      type: String,
      enum: ["Office", "Freelance"],
      default: "Office",
    },
    department: {
      type: [String],
      default: [],
    },
    branches: [
      {
        branch: {
          type: String,
          enum: ["Badarpur", "Kalkaji"],
          default: null 
        },
        timing: {
          start: { type: String, default: null },
          end: { type: String, default: null },
        },
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      required: true,
    },
    salary: {
      type: Number,
      default: 0,
    },
    account_details: {
      account_name: { type: String },
      account_number: { type: String },
      account_ifsc: { type: String },
      pf: { type: Boolean, default: false },
      esi: { type: Boolean, default: false },
    },
    advance_payment: {
      type: Number,
      default: 0,
    },
    repayments: [
      {
        amount: { type: Number, default: null },
        date: { type: Date, default: null },
        notes: { type: String, default: null },
      },
    ],
    bankDetails: {
      bankName: { type: String },
      accountNo: { type: String },
      ifscCode: { type: String },
      upiId: { type: String },
    },
    emergencyContacts: [
      {
        firstName: { type: String },
        relation: {
          type: String,
          enum: ["Father", "Mother", "Husband", "Wife", "Brother", "Sister", "Other"],
        },
        contactNo: { type: String },
        status: { type: String },
      },
    ],
    educationalDetails: [
      {
        degree: { type: String },
        institution: { type: String },
        yearOfPassing: { type: Number },
        percentage: { type: String },
      },
    ],
    lastOrganizationDetails: [
      {
        organizationName: { type: String },
        position: { type: String },
        from: { type: Date },
        to: { type: Date },
        ctc: { type: String },
      },
    ],
    familyDetails: [
      {
        familyMemberName: { type: String },
        relation: {
          type: String,
          enum: ["Father", "Mother", "Husband", "Wife", "Brother", "Sister", "Other"],
        },
        age: { type: Number },
        occupation: { type: String },
        dob: { type: Date },
      },
    ],
    online: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
