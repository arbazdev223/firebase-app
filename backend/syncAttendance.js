const mongoose = require("mongoose");
const {pool} = require("./config/db"); // MySQL pool
const Attendance = require("./models/Attendance");
const User = require("./models/User");
const ApplyLeave = require("./models/Leave");
const Holiday = require("./models/Holiday");
const moment = require('moment-timezone'); // Add moment-timezone import
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/instituteDB";
mongoose.connect(mongoURI);

mongoose.connection.on("connected", () => {
  console.log("? MongoDB Connected");
});
mongoose.connection.on("error", (err) => {
  console.error("? MongoDB Error:", err);
});

(async () => {
  try {
    // Support for date range: use SYNC_DATE_RANGE if set, else today
    let startDate, endDate;
    
    if (process.env.SYNC_DATE_RANGE) {
      // Format: "2025-08-01,2025-08-24"
      const [start, end] = process.env.SYNC_DATE_RANGE.split(',');
      startDate = new Date(start);
      endDate = new Date(end);
      console.log(`?? Syncing attendance for date range: ${start} to ${end}`);
    } else if (process.env.SYNC_DATE) {
      // Single date backfill
      startDate = new Date(process.env.SYNC_DATE);
      endDate = new Date(process.env.SYNC_DATE);
      console.log(`?? Syncing attendance for single date: ${startDate.toISOString().split('T')[0]}`);
    } else {
      // Today
      startDate = new Date();
      endDate = new Date();
      console.log(`?? Syncing attendance for today: ${startDate.toISOString().split('T')[0]}`);
    }
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`?? Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const [rows] = await pool.query(`
      SELECT 
        emp_code,
        DATE(login) AS attendance_date,
        MIN(TIME(login)) AS log_in,
        MAX(TIME(login)) AS log_out,
        device_name
      FROM attendances
      WHERE login >= ? AND login <= ?
      GROUP BY emp_code, DATE(login), device_name
      ORDER BY attendance_date, emp_code
    `, [startDate, endDate]);

    console.log(`?? Found ${rows.length} attendance entries for date range`);

    // Group rows by date for better processing
    const rowsByDate = {};
    rows.forEach(row => {
      const dateKey = row.attendance_date.toISOString().split('T')[0];
      if (!rowsByDate[dateKey]) {
        rowsByDate[dateKey] = [];
      }
      rowsByDate[dateKey].push(row);
    });

    console.log(`?? Processing dates:`, Object.keys(rowsByDate));

    // Process each date separately
    for (const [dateKey, dateRows] of Object.entries(rowsByDate)) {
      console.log(`\n?? Processing date: ${dateKey} with ${dateRows.length} entries`);
      
      const insertedDates = new Set();

      for (const row of dateRows) {
      const formattedUserCode = row.emp_code.toString().padStart(4, "0");

      const user = await User.findOne({ user_code: formattedUserCode });

      if (!user) {
        console.warn(`?? User with code ${formattedUserCode} not found in MongoDB`);
        continue;
      }

      // Proper timezone handling using moment.js
      // MySQL date is in local timezone, convert to UTC properly
      const mysqlDate = row.attendance_date; // Format: YYYY-MM-DD
      const attendanceDate = moment.tz(mysqlDate, 'Asia/Kolkata').startOf('day').toDate();

      if (isNaN(attendanceDate.getTime())) {
        console.error(`? Invalid date format for ${row.attendance_date} for ${formattedUserCode}`);
        continue;
      }

      const dateOnly = attendanceDate.toISOString().split("T")[0];
      insertedDates.add(dateOnly);

      // Check Leave
      const leave = await ApplyLeave.findOne({
        userId: user._id,
        status: "Approved",
        $or: [
          { startDate: { $lte: attendanceDate }, endDate: { $gte: attendanceDate } }
        ]
      });

      if (leave) {
        await Attendance.findOneAndUpdate(
          { user_id: user._id, attendance_date: attendanceDate },
          {
            log_in: null,
            log_out: null,
            status: "Leave",
            branch: row.device_name,
          },
          { upsert: true, new: true }
        );
        console.log(`?? Leave marked for ${user.user_code} on ${dateOnly}`);
        continue;
      }

      // Check Holiday
      const oneDayHoliday = await Holiday.findOne({
        holidayType: "One Day Holiday",
        date: attendanceDate,
      });

      const longHoliday = await Holiday.findOne({
        holidayType: "Long Holiday",
        from: { $lte: attendanceDate },
        to: { $gte: attendanceDate },
      });

      if (oneDayHoliday || longHoliday) {
        await Attendance.findOneAndUpdate(
          { user_id: user._id, attendance_date: attendanceDate },
          {
            log_in: null,
            log_out: null,
            status: "Holiday",
            branch: row.device_name,
          },
          { upsert: true, new: true }
        );
        console.log(`?? Holiday marked for ${user.user_code} on ${dateOnly}`);
        continue;
      }

      // Determine status
      let status = "Present";

      if (!row.log_in) {
        status = "Absent";
        console.log(`?? [${user.user_code}] No login found, marking Absent`);
      } else {
        if (user.branches && user.branches.length > 0) {
          const deviceName = (row.device_name || "").toLowerCase();

          const matchedBranch = user.branches.find(branchObj => {
            return deviceName.includes((branchObj.branch || "").toLowerCase());
          });

          if (matchedBranch && matchedBranch.timing.start && matchedBranch.timing.end) {
            const officeStart = new Date(`1970-01-01T${matchedBranch.timing.start}`);
            const officeEnd = new Date(`1970-01-01T${matchedBranch.timing.end}`);
            const logInTimeObj = new Date(`1970-01-01T${row.log_in}`);
            const logOutTimeObj = new Date(`1970-01-01T${row.log_out}`);

            const diffMinutes = (logInTimeObj - officeStart) / 60000;
            const diffEndMinutes = (logOutTimeObj - officeEnd) / 60000;

            // Check if user left early (before office end time)
            if (diffEndMinutes < -90) {
              status = "Half Day";
            } else if (diffMinutes <= 0) {
              status = "Present";
            } else if (diffMinutes > 0 && diffMinutes <= 15) {
              status = "Late";
            } else if (diffMinutes > 15 && diffMinutes <= 45) {
              status = "Much Late";
            } else {
              status = "Half Day";
            }

            console.log(`?? [${user.user_code}] Login: ${row.log_in}, Logout: ${row.log_out}, Office: ${matchedBranch.timing.start}-${matchedBranch.timing.end}, Status: ${status}`);
          } else {
            console.warn(`?? No matching branch timing found for user ${user.user_code}`);
          }
        } else {
          console.warn(`?? No branch info available for user ${user.user_code}`);
        }
      }

      // Insert or Update Attendance
      await Attendance.findOneAndUpdate(
        { user_id: user._id, attendance_date: attendanceDate },
        {
          log_in: row.log_in || null,
          log_out: row.log_out || null,
          status: status,
          branch: row.device_name,
        },
        { upsert: true, new: true }
      );

        console.log(`? Attendance saved for ${formattedUserCode} on ${dateKey}`);
      }
      
      // After punch processing for this date, insert Absent for users with no punch
      await processAbsentUsers(dateKey, dateRows);
      
      // Handle Sunday for this date
      const currentDate = new Date(dateKey);
      if (currentDate.getDay() === 0) {
        await processSundayUsers(dateKey);
      }
    }

    // Helper function to process absent users for a specific date
    async function processAbsentUsers(dateKey, dateRows) {
      const allActiveUsers = await User.find({ status: "Active" });
      const presentUserCodes = new Set(dateRows.map(row => row.emp_code.toString().padStart(4, "0")));
      const currentDate = new Date(dateKey);

      for (const user of allActiveUsers) {
        // Skip admin user 0003
        if (user.user_code === '0003') continue;
        
        // Check if already has attendance for this date
        const alreadyExists = await Attendance.findOne({ user_id: user._id, attendance_date: currentDate });
        if (!presentUserCodes.has(user.user_code) && !alreadyExists) {
          // Check if user is on Leave or Holiday
          const leave = await ApplyLeave.findOne({
            userId: user._id,
            status: "Approved",
            $or: [
              { startDate: { $lte: currentDate }, endDate: { $gte: currentDate } }
            ]
          });
          const oneDayHoliday = await Holiday.findOne({
            holidayType: "One Day Holiday",
            date: currentDate,
          });
          const longHoliday = await Holiday.findOne({
            holidayType: "Long Holiday",
            from: { $lte: currentDate },
            to: { $gte: currentDate },
          });
          if (!leave && !oneDayHoliday && !longHoliday && currentDate.getDay() !== 0) {
            // Only create record for assigned branches
            const assignedBranches = user.branches?.map(b => b.branch) || [];
            
            if (assignedBranches.length > 0) {
              for (const branch of assignedBranches) {
                await Attendance.findOneAndUpdate(
                  { user_id: user._id, attendance_date: currentDate, branch },
                  {
                    log_in: null,
                    log_out: null,
                    status: "Absent",
                    branch,
                  },
                  { upsert: true, new: true }
                );
                console.log(`? Absent marked for ${user.user_code} on ${dateKey} at branch ${branch}`);
              }
            } else {
              // Fallback to unknown branch if no branches assigned
              await Attendance.findOneAndUpdate(
                { user_id: user._id, attendance_date: currentDate, branch: "unknown" },
                {
                  log_in: null,
                  log_out: null,
                  status: "Absent",
                  branch: "unknown",
                },
                { upsert: true, new: true }
              );
              console.log(`? Absent marked for ${user.user_code} on ${dateKey} at unknown branch`);
            }
          }
        }
      }
    }

    // Helper function to process Sunday users for a specific date
    async function processSundayUsers(dateKey) {
      console.log(`?? It's Sunday: ${dateKey}`);
      const currentDate = new Date(dateKey);
      const activeUsers = await User.find({ status: "Active" });

      for (const user of activeUsers) {
        // Only insert if no attendance record exists for this user on this date
        const alreadyExists = await Attendance.findOne({ user_id: user._id, attendance_date: currentDate });
        if (!alreadyExists) {
          // Only create record for assigned branches
          const assignedBranches = user.branches?.map(b => b.branch) || [];
          
          if (assignedBranches.length > 0) {
            for (const branch of assignedBranches) {
              await Attendance.findOneAndUpdate(
                { user_id: user._id, attendance_date: currentDate, branch },
                {
                  log_in: null,
                  log_out: null,
                  status: "Sunday",
                  branch,
                },
                { upsert: true, new: true }
              );
              console.log(`? Sunday inserted for ${user.user_code} on ${dateKey} at branch ${branch}`);
            }
          } else {
            // Fallback to unknown branch if no branches assigned
            await Attendance.findOneAndUpdate(
              { user_id: user._id, attendance_date: currentDate, branch: "unknown" },
              {
                log_in: null,
                log_out: null,
                status: "Sunday",
                branch: "unknown",
              },
              { upsert: true, new: true }
            );
            console.log(`? Sunday inserted for ${user.user_code} on ${dateKey} at unknown branch`);
          }
        }
      }
    }

    console.log("?? Today's Attendance sync completed!");
    process.exit(0);
  } catch (err) {
    console.error("? Error syncing attendance:", err);
    process.exit(1);
  }
})();
