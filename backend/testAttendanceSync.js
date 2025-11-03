const mongoose = require("mongoose");
const pool = require("./config/db"); // MySQL pool
const Attendance = require("./models/Attendance");
const User = require("./models/User");
const ApplyLeave = require("./models/Leave");
const Holiday = require("./models/Holiday");

mongoose.connect("mongodb://localhost:27017/instituteDB");

mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB Connected");
});
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB Error:", err);
});

(async () => {
  try {
    console.log("🧪 Testing Attendance Sync with your data format...");
    
    // Test with your specific data
    const testDate = new Date('2024-02-10');
    testDate.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(testDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`📅 Testing for date: ${testDate.toISOString().split('T')[0]}`);

    // Test the corrected query
    const [rows] = await pool.query(`
      SELECT 
        emp_code,
        DATE(logIn) AS attendance_date,
        MIN(TIME(logIn)) AS log_in,
        MAX(TIME(logIn)) AS log_out,
        device_name
      FROM attendances
      WHERE logIn >= ? AND logIn < ?
      GROUP BY emp_code, DATE(logIn), device_name
    `, [testDate, tomorrow]);

    console.log(`🔍 Found ${rows.length} attendance entries for test date`);
    console.log("📊 Sample data:", rows);

    // Test user lookup
    for (const row of rows) {
      const formattedUserCode = row.emp_code.toString().padStart(4, "0");
      console.log(`👤 Looking for user with code: ${formattedUserCode}`);
      
      const user = await User.findOne({ user_code: formattedUserCode });
      
      if (user) {
        console.log(`✅ Found user: ${user.name} (${user.user_code})`);
        console.log(`🏢 User branches:`, user.branches);
        
        // Test device name mapping
        const deviceName = (row.device_name || "").toLowerCase();
        console.log(`📱 Device name: ${deviceName}`);
        
        if (user.branches && user.branches.length > 0) {
          const matchedBranch = user.branches.find(branchObj => {
            const branchName = (branchObj.branch || "").toLowerCase();
            return deviceName.includes(branchName) || 
                   deviceName.includes(branchName.replace('ifda-', ''));
          });
          
          if (matchedBranch) {
            console.log(`✅ Matched branch: ${matchedBranch.branch}`);
            console.log(`⏰ Branch timing: ${matchedBranch.timing?.start} - ${matchedBranch.timing?.end}`);
          } else {
            console.log(`❌ No matching branch found`);
          }
        }
      } else {
        console.log(`❌ User not found for code: ${formattedUserCode}`);
      }
      
      console.log("---");
    }

    console.log("🎉 Test completed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test error:", err);
    process.exit(1);
  }
})(); 