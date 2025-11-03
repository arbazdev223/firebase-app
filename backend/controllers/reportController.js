const Enqure = require('../models/Enqure');

// Helper to parse date params (YYYY-MM-DD)
const parseDate = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt;
};

exports.getCallReports = async (req, res) => {
  try {
    const { start, end, caller, branch, limit = 1000 } = req.query;

    const startDate = parseDate(start);
    const endDate = parseDate(end);

    const matchBase = {};
    // Filter by caller (user id)
    if (caller) matchBase.caller = caller;
    if (branch) matchBase.branch = branch;

    // dailyCounts: only records with callingDate
    const matchForCalled = { ...matchBase, callingDate: { $ne: null } };
    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      matchForCalled.callingDate = { $gte: s, $lte: e };
    }

    const dailyPipeline = [
      { $match: matchForCalled },
      { $project: { day: { $dateToString: { format: "%Y-%m-%d", date: "$callingDate" } } } },
      { $group: { _id: "$day", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ];

    const perLeadPipeline = [
      { $match: matchForCalled },
      { $group: { _id: "$studentMobile", studentName: { $first: "$studentName" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ];

    // Uncalled leads: callingDate is null or missing AND not deleted
    const matchForUncalled = { ...matchBase, $or: [{ callingDate: null }, { callingDate: { $exists: false } }], assign: { $ne: 'Delete' } };

    // If start/end provided, consider uncalled within date range as those created in range but never called
    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0,0,0,0);
      const e = new Date(endDate);
      e.setHours(23,59,59,999);
      matchForUncalled.enquiryDate = { $gte: s, $lte: e };
    }

    const uncalledPipeline = [
      { $match: matchForUncalled },
      { $project: { studentName: 1, studentMobile: 1, caller: 1, assign: 1, enquiryDate: 1, createdAt: 1 } },
      { $sort: { createdAt: -1 } },
      { $limit: parseInt(limit) }
    ];

    const [dailyCountsRaw, perLeadRaw, uncalledRaw] = await Promise.all([
      Enqure.aggregate(dailyPipeline),
      Enqure.aggregate(perLeadPipeline),
      Enqure.aggregate(uncalledPipeline)
    ]);

    const dailyCounts = dailyCountsRaw.map(d => ({ date: d._id, count: d.count }));
    const perLeadCounts = perLeadRaw.map(p => ({ studentMobile: p._id, studentName: p.studentName, count: p.count }));

    res.status(200).json({
      success: true,
      summary: {
        dailyCounts,
        perLeadCounts,
        uncalledLeads: uncalledRaw
      }
    });
  } catch (err) {
    console.error('Error in getCallReports:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
