const SalarySlip = require('../models/SalarySlip');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Incentive = require('../models/Incentive');
const Leave = require('../models/Leave');
const PDFDocument = require('pdfkit');
const moment = require('moment');

// Helper: Calculate deductions for a user for a month
async function calculateDeductions(user, month) {
  // month: YYYY-MM
  const [year, mon] = month.split('-');
  const start = new Date(year, parseInt(mon) - 1, 1);
  const end = new Date(year, parseInt(mon), 0, 23, 59, 59, 999);

  // Attendance: count Absent, Late, Half Day, Much Late
  const attendance = await Attendance.find({
    user_id: user._id,
    attendance_date: { $gte: start, $lte: end },
  });
  const absentDays = attendance.filter(a => a.status === 'Absent').length;
  const halfDays = attendance.filter(a => a.status === 'Half Day').length;
  const lateDays = attendance.filter(a => a.status === 'Late').length;
  const muchLateDays = attendance.filter(a => a.status === 'Much Late').length;

  // 1.5 paid leave per month
  let unpaidAbsents = absentDays - 1.5;
  if (unpaidAbsents < 0) unpaidAbsents = 0;

  // Much Late logic: first 3 free, after that, every 2 = 1 half day deduction
  let muchLateDeductHalfDays = 0;
  if (muchLateDays > 3) {
    muchLateDeductHalfDays = Math.floor((muchLateDays - 3) / 2);
  }

  // Per day salary
  const perDaySalary = user.salary ? user.salary / 30 : 0;
  const absentDeduction = unpaidAbsents * perDaySalary;
  const halfDayDeduction = (halfDays + muchLateDeductHalfDays) * perDaySalary * 0.5;
  const lateDeduction = lateDays * perDaySalary * 0.25; // e.g. 1/4th per late day

  // Advance repayment
  const advance = user.advance_payment || 0;
  let advanceDeduction = 0;
  if (advance > 0 && user.repayments && user.repayments.length > 0) {
    // Repayments in this month
    const repayments = user.repayments.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d >= start && d <= end;
    });
    advanceDeduction = repayments.reduce((sum, r) => sum + (r.amount || 0), 0);
  }

  // Deductions array
  const deductions = [];
  if (absentDeduction > 0) deductions.push({ type: 'Absent', amount: absentDeduction, reason: `${unpaidAbsents} unpaid absents (first 1.5 are paid leave)` });
  if (halfDayDeduction > 0) deductions.push({ type: 'Half Day', amount: halfDayDeduction, reason: `${halfDays} half days + ${muchLateDeductHalfDays} half days from much late (first 3 much late free, then every 2 = 1 half day)` });
  if (lateDeduction > 0) deductions.push({ type: 'Late', amount: lateDeduction, reason: `${lateDays} late days (1/4th per late)` });
  if (advanceDeduction > 0) deductions.push({ type: 'Advance Repayment', amount: advanceDeduction, reason: 'Advance repayment' });

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  return { deductions, totalDeductions };
}

// Helper: Calculate incentives for a user for a month
async function calculateIncentives(user, month) {
  const [year, mon] = month.split('-');
  const start = new Date(year, parseInt(mon) - 1, 1);
  const end = new Date(year, parseInt(mon), 0, 23, 59, 59, 999);
  const incentives = await Incentive.find({
    UserId: user._id,
    payableDate: { $gte: start, $lte: end },
  });
  return incentives.reduce((sum, i) => sum + (parseFloat(i.Amount) || 0), 0);
}

// Generate salary slip for all users for a month
exports.generateMonthlySlips = async (req, res) => {
  try {
    const { month } = req.body; // Format: YYYY-MM
    const users = await User.find({ status: 'Active' });
    const slips = [];
    for (const user of users) {
      const basicSalary = user.salary || 0;
      const { deductions, totalDeductions } = await calculateDeductions(user, month);
      const incentives = await calculateIncentives(user, month);
      const netPay = basicSalary - totalDeductions + incentives;
      const slip = await SalarySlip.findOneAndUpdate(
        { user: user._id, month },
        {
          user: user._id,
          month,
          basicSalary,
          totalDeductions,
          deductions,
          incentives,
          netPay,
        },
        { upsert: true, new: true }
      );
      slips.push(slip);
    }
    res.json({ success: true, slips });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all salary slips for a user
exports.getUserSlips = async (req, res) => {
  try {
    const userId = req.params.userId;
    const slips = await SalarySlip.find({ user: userId }).sort({ month: -1 });
    res.json({ success: true, slips });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get department salary report for a month
exports.getDepartmentReport = async (req, res) => {
  try {
    const { month } = req.query;
    const slips = await SalarySlip.find({ month }).populate('user');
    const report = {};
    for (const slip of slips) {
      const dept = slip.user.department?.[0] || 'Unknown';
      if (!report[dept]) report[dept] = 0;
      report[dept] += slip.netPay;
    }
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Generate PDF for a salary slip
exports.getSlipPDF = async (req, res) => {
  try {
    const slip = await SalarySlip.findById(req.params.slipId).populate('user');
    if (!slip) return res.status(404).send('Slip not found');
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=SalarySlip-${slip.user.name}-${slip.month}.pdf`);
    doc.text(`Salary Slip for ${slip.user.name}`);
    doc.text(`Month: ${slip.month}`);
    doc.text(`Basic Salary: ?${slip.basicSalary}`);
    doc.text(`Incentives: ?${slip.incentives}`);
    doc.text(`Total Deductions: ?${slip.totalDeductions}`);
    doc.text('Deductions:');
    slip.deductions.forEach(d => {
      doc.text(`- ${d.type}: ?${d.amount} (${d.reason})`);
    });
    doc.text(`Net Pay: ?${slip.netPay}`);
    doc.end();
    doc.pipe(res);
  } catch (err) {
    res.status(500).send('Error generating PDF');
  }
}; 