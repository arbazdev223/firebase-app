const mongoose = require("mongoose");
const { Holiday } = require("../models");
const Employee = require("../models/User");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
require('dotenv').config();

// MongoDB Connection Setup
const connectMongoDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/instituteDB';
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 30000,  // 30 seconds
            socketTimeoutMS: 45000,           // 45 seconds
            connectTimeoutMS: 30000,          // 30 seconds
            maxPoolSize: 10,
            minPoolSize: 1,
        });
        console.log('? MongoDB connected successfully for attendance script');
    } catch (error) {
        console.error('? MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

// Helper: Get start of day (00:00:00) for any date
function getStartOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

exports.InsertDailyAttendance = async (specificDate = null) => {
    try {
        await connectMongoDB();

        const today = specificDate ? new Date(specificDate) : new Date();
        const todayStart = getStartOfDay(today);
        const todayDateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
        console.log("Checking for holidays and Sunday for date:", todayDateStr);

        // Check for holidays with proper date comparison
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        const holidays = await Holiday.find({
            $or: [
                { 
                    holidayType: "One Day Holiday", 
                    date: { $gte: startOfDay, $lte: endOfDay } 
                },
                { 
                    holidayType: "Long Holiday", 
                    from: { $lte: endOfDay }, 
                    to: { $gte: startOfDay } 
                }
            ]
        });
        
        console.log(`Found ${holidays.length} holidays for ${todayDateStr}`);
        if (holidays.length > 0) {
            holidays.forEach(holiday => {
                console.log(`- ${holiday.holidayName}: ${holiday.holidayType}`);
                if (holiday.holidayType === "One Day Holiday") {
                    console.log(`  Date: ${holiday.date}`);
                } else {
                    console.log(`  From: ${holiday.from}, To: ${holiday.to}`);
                }
            });
        } else {
            console.log('No holidays found for this date');
        }

        let isHoliday = false;
        let isSunday = false;

        if (holidays.length > 0) {
            await markHolidayAttendance(today);
            console.log("? Holiday attendance inserted.");
            isHoliday = true;
        }

        // Check for Sunday
        if (today.getDay() === 0) {
            await markSundayAttendance(today);
            console.log("? Sunday attendance inserted.");
            isSunday = true;
        }

        // Process active employees (even on holidays/Sundays for absent tracking)
        const employees = await Employee.find({ status: "Active" });
        console.log(`Found ${employees.length} active employees.`);

        for (const employee of employees) {
            try {
                // Only process branches where employee is actually assigned
                const assignedBranches = employee.branches?.map(b => b.branch) || [];
                
                if (assignedBranches.length === 0) {
                    console.log(`Employee ${employee.name} has no branch assignment, skipping`);
                    continue;
                }
                
                console.log(`Employee ${employee.name} assigned to branches:`, assignedBranches);
                
                for (const branch of assignedBranches) {
                    console.log(`Checking attendance for ${employee.name} (${employee.user_code}) at branch ${branch}`);

                // Skip normal processing if it's holiday or Sunday (already marked above)
                if (isHoliday || isSunday) {
                    console.log(`Skipping normal processing for ${employee.name} - ${isHoliday ? 'Holiday' : 'Sunday'}`);
                    continue;
                }

                // Find attendance for the day
                const attendances = await Attendance.find({
                    user_id: employee._id,
                    attendance_date: todayStart,
                    branch: branch
                });

                // punches array बनाएं
                let punches = [];
                if (attendances.length > 0) {
                    punches = attendances
                        .filter(a => a.log_in || a.log_out)
                        .map(a => ({
                            in: a.log_in || null,
                            out: a.log_out || null
                        }));
                    // Get earliest login and latest logout
                    logInTime = attendances.reduce((min, a) => 
                        a.log_in && (!min || a.log_in < min) ? a.log_in : min, null);
                    logOutTime = attendances.reduce((max, a) => 
                        a.log_out && (!max || a.log_out > max) ? a.log_out : max, null);

                    console.log(`Log-in time: ${logInTime}, Log-out time: ${logOutTime}`);

                    // Check if employee has timing settings (using branches array)
                    const employeeBranch = employee.branches?.find(b => b.branch === branch);
                    if (employeeBranch?.timing?.start && employeeBranch?.timing?.end) {
                        const startTime = new Date(`1970-01-01T${employeeBranch.timing.start}`);
                        const endTime = new Date(`1970-01-01T${employeeBranch.timing.end}`);
                        const logInTimeObj = logInTime ? new Date(`1970-01-01T${logInTime}`) : null;
                        const logOutTimeObj = logOutTime ? new Date(`1970-01-01T${logOutTime}`) : null;

                        if (logInTimeObj) {
                            const diffMinutes = (logInTimeObj - startTime) / 60000;
                            const diffEndMinutes = logOutTimeObj ? (endTime - logOutTimeObj) / 60000 : 0;

                            if (diffEndMinutes <= -90) {
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
                        }
                        console.log(`Employee status: ${status}`);
                    } else {
                        // If no timing settings, mark as present if they have any attendance
                        status = "Present";
                    }
                } else {
                    // Check for approved leave
                    const leave = await Leave.findOne({
                        user: employee._id,  // Fixed: use user instead of userId
                        status: "Approved",
                        startDate: { $lte: today },  // Fixed: use startDate instead of starting_date
                        endDate: { $gte: today }     // Fixed: use endDate instead of ending_date
                    });

                    if (leave) {
                        status = "Leave";
                        console.log(`Employee ${employee.name} is on approved leave`);
                    }
                }

                // Insert/Update attendance record
                await Attendance.findOneAndUpdate(
                    { user_id: employee._id, attendance_date: todayStart, branch: branch },
                    {
                        user_id: employee._id,
                        attendance_date: todayStart,
                        log_in: logInTime,
                        log_out: logOutTime,
                        punches, // <-- add this line
                        status,
                        branch
                    },
                    { upsert: true, new: true }
                );
                console.log(`Updated/Inserted attendance for ${employee.name} at ${branch}: ${status}`);
            }
                } catch (employeeError) {
                    console.error(`Error processing employee ${employee.name}:`, employeeError);
                    continue; // Continue with next employee
                }
            }

        console.log("? Daily attendance inserted successfully.");
    } catch (error) {
        console.error("? Error inserting daily attendance:", error);
        throw error;
    } finally {
        try {
            await mongoose.connection.close();
            console.log('? MongoDB connection closed');
        } catch (closeError) {
            console.error('? Error closing MongoDB connection:', closeError);
        }
    }
};

// ?? Mark holiday attendance
async function markHolidayAttendance(today) {
    try {
        const todayStart = getStartOfDay(today);
        const employees = await Employee.find({ status: "Active" });
        console.log(`Marking holiday attendance for ${employees.length} employees.`);
        for (const employee of employees) {
            // Only process branches where employee is actually assigned
            const assignedBranches = employee.branches?.map(b => b.branch) || [];
            
            if (assignedBranches.length === 0) {
                continue;
            }
            
            for (const branch of assignedBranches) {
                await Attendance.findOneAndUpdate(
                    { user_id: employee._id, attendance_date: todayStart, branch },
                    {
                        user_id: employee._id,
                        attendance_date: todayStart,
                        log_in: null,
                        log_out: null,
                        status: "Holiday",
                        branch
                    },
                    { upsert: true, new: true }
                );
            }
        }
    } catch (error) {
        console.error("Error marking holiday attendance:", error);
    }
}

// ?? Mark Sunday attendance
async function markSundayAttendance(today) {
    try {
        const todayStart = getStartOfDay(today);
        const employees = await Employee.find({ status: "Active", user_code: { $ne: 3 } });
        console.log(`Marking Sunday attendance for ${employees.length} employees.`);
        for (const employee of employees) {
            // Only process branches where employee is actually assigned
            const assignedBranches = employee.branches?.map(b => b.branch) || [];
            
            if (assignedBranches.length === 0) {
                continue;
            }
            
            for (const branch of assignedBranches) {
                await Attendance.findOneAndUpdate(
                    { user_id: employee._id, attendance_date: todayStart, branch },
                    {
                        user_id: employee._id,
                        attendance_date: todayStart,
                        log_in: null,
                        log_out: null,
                        status: "Sunday",
                        branch
                    },
                    { upsert: true, new: true }
                );
            }
        }
    } catch (error) {
        console.error("Error marking Sunday attendance:", error);
    }
}
