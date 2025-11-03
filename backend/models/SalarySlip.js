const mongoose = require('mongoose');

const deductionSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g. 'Leave', 'Late', 'Advance', etc.
  amount: { type: Number, required: true },
  reason: { type: String, default: '' },
});

const salarySlipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, // Format: YYYY-MM
  basicSalary: { type: Number, required: true },
  totalDeductions: { type: Number, required: true },
  deductions: [deductionSchema],
  incentives: { type: Number, default: 0 },
  netPay: { type: Number, required: true },
  generatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SalarySlip', salarySlipSchema); 