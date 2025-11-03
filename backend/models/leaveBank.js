const mongoose = require('mongoose');

// Leave Balance Subschema
const leaveBalanceSchema = new mongoose.Schema({
  leaveMonth: { type: String, required: true },
  pl: { type: Number, default: 0 }, // Paid Leave
  sl: { type: Number, default: 0 }, // Sick Leave
});

// Leave Bank Schema
const leaveBankSchema = new mongoose.Schema({
  userId: {     type: mongoose.Schema.Types.ObjectId,
      ref: 'User', required: true }, // Connects to user
  leaveBalance: [leaveBalanceSchema], // Array of leave balances for each month
  usedLeaves: [leaveBalanceSchema],   // Array of used leaves for each month
});

module.exports = mongoose.model('LeaveBank', leaveBankSchema);
