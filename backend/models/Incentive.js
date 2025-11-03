// models/Incentive.js
const mongoose = require('mongoose');

const IncentiveSchema = new mongoose.Schema({
  UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  Amount: { type: String, default: null },
  payableDate: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Incentive', IncentiveSchema);