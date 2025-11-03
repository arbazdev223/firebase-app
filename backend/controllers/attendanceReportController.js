const Attendance = require('../models/Attendance');
const User = require('../models/User');
const dayjs = require('dayjs');

function toTimeObj(str) {
    return str ? dayjs(`1970-01-01T${str}`) : null;
}

const STATUS_PRIORITY = [
  'Present', 'Late', 'Much Late', 'Half Day', 'Leave', 'Holiday', 'Sunday', 'Absent'
];

exports.getAttendanceReport = async (req, res) => {
    try {
        const { from, to, user } = req.query;
        const fromDate = from ? dayjs(from).startOf('day').toDate() : dayjs().subtract(2, 'month').startOf('day').toDate();
        const toDate = to ? dayjs(to).endOf('day').toDate() : dayjs().endOf('day').toDate();

        const userFilter = { status: 'Active' };
        if (user) userFilter._id = user;
        const users = await User.find(userFilter);

        const attendanceRecords = await Attendance.find({
            attendance_date: { $gte: fromDate, $lte: toDate }
        });

        let report = [];
        for (const u of users) {
            const userBranches = u.branches && u.branches.length > 0 ? u.branches : [{ branch: '', timing: { start: '10:00', end: '18:00' } }];
            const timing = userBranches[0].timing || { start: '10:00', end: '18:00' };
            const startTime = toTimeObj(timing.start) || dayjs('1970-01-01T10:00');
            const endTime = toTimeObj(timing.end) || dayjs('1970-01-01T18:00');

            // Filter attendance for this user (ignore branch)
            const userAtt = attendanceRecords.filter(a => String(a.user_id) === String(u._id));

            // Group by attendance_date (date only), pick highest priority status
            const dayMap = {};
            userAtt.forEach(a => {
                const dateStr = dayjs(a.attendance_date).format('YYYY-MM-DD');
                if (!dayMap[dateStr]) {
                    dayMap[dateStr] = a;
                } else {
                    const prev = dayMap[dateStr];
                    if (
                        STATUS_PRIORITY.indexOf(a.status) < STATUS_PRIORITY.indexOf(prev.status)
                    ) {
                        dayMap[dateStr] = a;
                    }
                }
            });
            const uniqueDays = Object.values(dayMap);

            let present = 0, absent = 0, leave = 0, holiday = 0, sunday = 0, late = 0, muchLate = 0, halfDay = 0, earlyLeave = 0, overtimeDays = 0, totalOvertimeHours = 0;

            uniqueDays.forEach(a => {
                if (a.status === 'Present') present++;
                if (a.status === 'Absent') absent++;
                if (a.status === 'Leave') leave++;
                if (a.status === 'Holiday') holiday++;
                if (a.status === 'Sunday') sunday++;
                if (a.status === 'Late') late++;
                if (a.status === 'Much Late') muchLate++;
                if (a.status === 'Half Day') halfDay++;

                if (a.log_out && timing.end) {
                    const logOutObj = toTimeObj(a.log_out);
                    if (logOutObj && logOutObj.isBefore(endTime)) earlyLeave++;
                    if (logOutObj && logOutObj.isAfter(endTime)) {
                        overtimeDays++;
                        totalOvertimeHours += logOutObj.diff(endTime, 'minute') / 60;
                    }
                }
            });

            const totalDays = uniqueDays.length;
            const regularAbsentee = absent > 5;
            const attendancePercent = totalDays > 0 ? ((present + late + muchLate + halfDay) / totalDays * 100).toFixed(1) : 0;

            report.push({
                userId: u._id,
                name: u.name,
                user_code: u.user_code,
                totalDays,
                present,
                absent,
                leave,
                holiday,
                sunday,
                late,
                muchLate,
                halfDay,
                earlyLeave,
                overtimeDays,
                totalOvertimeHours: Number(totalOvertimeHours.toFixed(2)),
                attendancePercent: Number(attendancePercent),
                regularAbsentee
            });
        }
        res.json(report);
    } catch (err) {
        console.error('Attendance report error:', err);
        res.status(200).json([]);
    }
};
