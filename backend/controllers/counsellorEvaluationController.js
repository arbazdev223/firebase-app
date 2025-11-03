const Enqure = require('../models/Enqure');
const Attendance = require('../models/Attendance');
const AllEnqureRemark = require('../models/AllEnqureRemark');
const Task = require('../models/task');
const TaskAssig = require('../models/TaskAssig');
const User = require('../models/User');
const MeetingRemark = require('../models/MeetingRemark');
const mongoose = require('mongoose');

// Helper to get month range
function getMonthRange(month) {
  const [year, m] = month.split('-');
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 1);
  return { $gte: start, $lt: end };
}

exports.getMonthlyCounsellorEvaluation = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'Month is required (YYYY-MM)' });
    const dateRange = getMonthRange(month);

    // Get all active counsellors (department-based)
    const counsellors = await User.find({ department: { $in: [/counsellor/i] }, status: 'Active' });
    console.log('Counsellors:', counsellors.map(c => ({ name: c.name, id: c._id })));

    // Debug: Print sample Enqure data
    const testEnquiries = await Enqure.find({}).limit(3);
    console.log('Sample Enquiries:', testEnquiries);
    // Debug: Print sample Attendance data
    const testAttendance = await Attendance.find({}).limit(3);
    console.log('Sample Attendance:', testAttendance);
    // Debug: Print sample AllEnqureRemark data
    const testRemarks = await AllEnqureRemark.find({}).limit(3);
    console.log('Sample AllEnqureRemark:', testRemarks);

    // For each counsellor, aggregate metrics
    const results = await Promise.all(counsellors.map(async (c) => {
      const cid = c._id;
      // Enquiries handled
      const enquiries = await Enqure.find({
        counsellor: cid,
        enquiryDate: dateRange, // Only count enquiries in the selected month
      });
      const totalEnquiries = enquiries.length;
      const admissions = enquiries.filter(e => e.admissionDate && e.enquiryType === 'Admission' && e.admissionDate >= dateRange.$gte && e.admissionDate < dateRange.$lt);
      const totalAdmissions = admissions.length;
      
      // Debug for Sidra
      if (c.name === 'Sidra') {
        console.log('Sidra Debug:', {
          totalEnquiries,
          totalAdmissions,
          dateRange,
          sampleAdmissions: admissions.slice(0, 3).map(a => ({
            admissionDate: a.admissionDate,
            enquiryType: a.enquiryType,
            amount: a.admissionAmount
          }))
        });
      }
      const admissionAmount = admissions.reduce((sum, e) => sum + (e.admissionAmount || 0), 0);
      const admissionRatio = totalEnquiries ? ((totalAdmissions / totalEnquiries) * 100).toFixed(1) : '0.0';
      // Incentive logic (above 1.5L)
      const above = Math.max(0, admissionAmount - 150000);
      const incentive = above > 0 ? Math.round(above * 0.02) : 0;

      // Follow-ups
      const followups = await AllEnqureRemark.find({
        counsellor: cid,
        createdAt: dateRange,
      });
      const totalFollowups = followups.length;
      const missedFollowups = followups.filter(f => f.status === 'Missed').length;

      // Attendance
      const attendance = await Attendance.find({
        user_id: cid,
        attendance_date: dateRange,
      });
      const present = attendance.filter(a => a.status === 'Present').length;
      const absent = attendance.filter(a => a.status === 'Absent').length;
      const late = attendance.filter(a => a.status === 'Late').length;
      const muchLate = attendance.filter(a => a.status === 'Much Late').length;
      const halfDay = attendance.filter(a => a.status === 'Half Day').length;
      const leave = attendance.filter(a => a.status === 'Leave').length;

      // Meeting Remark (manager/supervisor)
      const meetingRemark = await MeetingRemark.findOne({
        selectedMembers: cid,
        createdAt: dateRange,
      }).sort({ createdAt: -1 });
      const starRating = meetingRemark ? meetingRemark.stars : 'NA';
      const managerRemark = meetingRemark ? meetingRemark.editorContent : '';

      // Tasks
      const assignedTasks = await TaskAssig.find({
        user: cid,
        createdAt: dateRange,
      });
      const totalTasks = assignedTasks.length;
      const completedTasks = assignedTasks.filter(t => t.status === 'Completed').length;
      const pendingTasks = totalTasks - completedTasks;

      return {
        counsellorId: cid,
        name: c.name,
        branch: c.branch,
        totalEnquiries,
        totalAdmissions,
        admissionRatio,
        admissionAmount,
        incentive,
        totalFollowups,
        missedFollowups,
        attendance: { present, absent, late, muchLate, halfDay, leave },
        tasks: { total: totalTasks, completed: completedTasks, pending: pendingTasks },
        starRating,
        managerRemark,
      };
    }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}; 