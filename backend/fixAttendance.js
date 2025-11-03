const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const User = require('./models/User');

async function fixTodayAttendance() {
  try {
    await mongoose.connect('mongodb://localhost:27017/instituteDB');
    console.log('Connected to MongoDB');
    
    // Get today's date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    console.log('Today (UTC):', today.toISOString());
    
    // Check if today's attendance exists for Arbaz
    const arbazUser = await User.findOne({ name: 'Arbaz' });
    if (arbazUser) {
      console.log('Arbaz User ID:', arbazUser._id);
      
      const todayAttendance = await Attendance.findOne({
        user_id: arbazUser._id,
        attendance_date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      console.log('Today attendance for Arbaz:', todayAttendance);
      
      // Create today's attendance if not exists
      if (!todayAttendance) {
        const newAttendance = new Attendance({
          user_id: arbazUser._id,
          attendance_date: today,
          log_in: '10:00:00',
          log_out: '18:00:00',
          status: 'Present',
          branch: 'ifda-kalkaji'
        });
        
        await newAttendance.save();
        console.log('Created today attendance for Arbaz');
      } else {
        console.log('Today attendance already exists for Arbaz');
      }
    }
    
    // Also check for admin user
    const adminUser = await User.findOne({ name: 'admin' });
    if (adminUser) {
      console.log('Admin User ID:', adminUser._id);
      
      const todayAttendance = await Attendance.findOne({
        user_id: adminUser._id,
        attendance_date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      console.log('Today attendance for Admin:', todayAttendance);
      
      // Create today's attendance if not exists
      if (!todayAttendance) {
        const newAttendance = new Attendance({
          user_id: adminUser._id,
          attendance_date: today,
          log_in: '09:00:00',
          log_out: '17:00:00',
          status: 'Present',
          branch: 'NA'
        });
        
        await newAttendance.save();
        console.log('Created today attendance for Admin');
      } else {
        console.log('Today attendance already exists for Admin');
      }
    }
    
    console.log('Attendance fix completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixTodayAttendance();
