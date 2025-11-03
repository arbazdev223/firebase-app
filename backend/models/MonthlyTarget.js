const mongoose = require('mongoose');

// Define the schema for the target entry
const targetSchema = new mongoose.Schema({
  username: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalRevenue: { type: Number, required: true },
  targets: [
    {
      course: { type: String, required: true },
      numberOfAdmissions: { type: Number, required: true },
      revenueAmount: { type: Number, required: true },
    },
  ],
  date: { type: Date, default: Date.now },
}, { timestamps: true });

// Create the model
const MonthlyTarget = mongoose.model('MonthlyTarget', targetSchema);

module.exports = MonthlyTarget;