const express = require('express');
const router = express.Router();

const { InsertDailyAttendance } = require('../Commands/InsertDailyAttendance');
const { getAttendanceReport } = require('../controllers/attendanceReportController');
const { getAllDailyAttendance, getAttendanceData, getUserAttendanceReport, getAllUsersAttendanceSummary } = require('../controllers/attendanceController');

// TEMP TEST: check which one is undefined
console.log('InsertDailyAttendance:', typeof InsertDailyAttendance);
console.log('getAttendanceReport:', typeof getAttendanceReport);
console.log('getAllDailyAttendance:', typeof getAllDailyAttendance);
console.log('getAttendanceData:', typeof getAttendanceData);
console.log('getUserAttendanceReport:', typeof getUserAttendanceReport);
console.log('getAllUsersAttendanceSummary:', typeof getAllUsersAttendanceSummary);

// Routes
router.post('/insert-daily', async (req, res) => {
    try {
        await InsertDailyAttendance();
        res.status(200).json({ message: '✅ Daily attendance inserted successfully.' });
    } catch (error) {
        console.error('❌ Error inserting attendance:', error);
        res.status(500).json({ message: '❌ Failed to insert daily attendance.' });
    }
});

router.get('/report', getAttendanceReport);

// ✅ add the route safely
router.get('/data', getAttendanceData);

router.get('/daily', getAllDailyAttendance);

// ✅ User-wise attendance report
router.get('/user-report', getUserAttendanceReport);

// backend/routes/attendanceRoutes.js
router.get('/all-daily', getAllDailyAttendance);

// All users summary attendance report
router.get('/all-users-summary', getAllUsersAttendanceSummary);

// API to get all punch in/out records for a user on a specific date
router.get('/user-punches/:userId/:date?', async (req, res) => {
    const { userId, date } = req.params;
    const { startDate, endDate } = req.query;
    try {
        const attendanceModel = require('../models/attendanceModel');
        const allAttendance = await attendanceModel.getAllAttendance();
        const empCodeForMySQL = parseInt(userId, 10);

        // Helper to get date string YYYY-MM-DD
        const getDateStr = (d) => new Date(d).toISOString().slice(0, 10);

        // Filter by user and date or date range
        let filtered = allAttendance.filter(record => {
            const recordEmpCode = record.emp_code ? parseInt(record.emp_code.toString(), 10) : null;
            const matchesEmpCode = recordEmpCode === empCodeForMySQL;
            if (!matchesEmpCode) return false;
            const recordDate = record.logIn ? getDateStr(record.logIn) : '';
            if (startDate && endDate) {
                return recordDate >= startDate && recordDate <= endDate;
            } else if (date) {
                return recordDate === date;
            }
            return false;
        });

        // Group by date
        const grouped = {};
        filtered.forEach(record => {
            const d = getDateStr(record.logIn);
            if (!grouped[d]) grouped[d] = [];
            grouped[d].push(record);
        });

        // For each date, sort punches and pair in/out
        const result = Object.entries(grouped).map(([d, records]) => {
            const punchTimes = records
                .map(r => new Date(r.logIn))
                .sort((a, b) => a - b);
            const punchPairs = [];
            for (let i = 0; i < punchTimes.length; i += 2) {
                const inTime = punchTimes[i];
                const outTime = punchTimes[i + 1] || null;
                punchPairs.push({
                    in: inTime ? inTime.toTimeString().slice(0, 5) : null,
                    out: outTime ? outTime.toTimeString().slice(0, 5) : null,
                    duration: inTime && outTime ? Math.round((outTime - inTime) / 60000) + ' min' : null
                });
            }
            return { date: d, punches: punchPairs };
        }).sort((a, b) => a.date.localeCompare(b.date));

        // If single date, return punches array for that date (for backward compatibility)
        if (date && result.length === 1) {
            return res.json({ punches: result[0].punches });
        }
        // Else, return array of { date, punches }
        res.json({ days: result });
    } catch (err) {
        console.error('Error fetching punches:', err);
        res.status(500).json({ error: 'Error fetching punches' });
    }
});

module.exports = router;
