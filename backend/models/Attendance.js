const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    attendance_date: { 
        type: Date, 
        required: true 
    },
    log_in: { 
        type: String, 
        default: null, 
        trim: true 
    },
    log_out: { 
        type: String, 
        default: null, 
        trim: true 
    },
    punches: [
        {
            in: { type: String, default: null },
            out: { type: String, default: null }
        }
    ],
    status: { 
        type: String, 
        enum: [
            "Present", "Late", "Much Late", "Half Day", "Absent", 
            "Leave", "Sunday", "Holiday", "Punching Missing"
        ], 
        required: true 
    },
    branch: { 
        type: String, 
        default: null, 
        trim: true 
    }
}, { timestamps: true });

const Attendance = mongoose.model("DailyAttendance", AttendanceSchema);

module.exports = Attendance;
