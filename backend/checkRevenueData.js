const mongoose = require('mongoose');
const Enqure = require('./models/Enqure');

// MongoDB connection
const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/instituteDB';
    await mongoose.connect(mongoURI);
    console.log('? MongoDB connected successfully');
  } catch (error) {
    console.error('? MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Check Monthly Revenue Data
const checkMonthlyRevenue = async () => {
  try {
    console.log('?? Checking Monthly Revenue Data...\n');
    
    // Get last 6 months data
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // MongoDB Query for this month
      const monthlyRevenue = await Enqure.aggregate([
        {
          $match: {
            enquiryType: 'Admission',
            admissionDate: { 
              $gte: startOfMonth, 
              $lte: endOfMonth,
              $ne: null 
            },
            totalFees: { $exists: true, $ne: null, $ne: 0 }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $ifNull: ['$totalFees', 0] }
            },
            count: { $sum: 1 }
          }
        }
      ]);

      const revenue = monthlyRevenue.length > 0 ? monthlyRevenue[0].totalRevenue : 0;
      const count = monthlyRevenue.length > 0 ? monthlyRevenue[0].count : 0;
      
      console.log(`?? ${monthName}:`);
      console.log(`   ?? Revenue: ?${revenue.toLocaleString()}`);
      console.log(`   ?? Records: ${count}`);
      console.log(`   ?? Date Range: ${startOfMonth.toLocaleDateString()} - ${endOfMonth.toLocaleDateString()}`);
      console.log('');
    }

    // Total Admission Revenue
    const totalAdmissionRevenue = await Enqure.aggregate([
      {
        $match: {
          enquiryType: 'Admission',
          admissionDate: { $exists: true, $ne: null },
          totalFees: { $exists: true, $ne: null, $ne: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $ifNull: ['$totalFees', 0] }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('?? TOTAL ADMISSION REVENUE:');
    console.log(`   ?? Total Revenue: ?${totalAdmissionRevenue.length > 0 ? totalAdmissionRevenue[0].totalRevenue.toLocaleString() : '0'}`);
    console.log(`   ?? Total Records: ${totalAdmissionRevenue.length > 0 ? totalAdmissionRevenue[0].count : 0}`);

    // Sample records for verification
    console.log('\n?? Sample Admission Records:');
    const sampleRecords = await Enqure.find({
      enquiryType: 'Admission',
      admissionDate: { $exists: true, $ne: null },
      totalFees: { $exists: true, $ne: null, $ne: 0 }
    })
    .select('studentName admissionDate totalFees enquiryType')
    .sort({ admissionDate: -1 })
    .limit(5);

    sampleRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.studentName}`);
      console.log(`      ?? Admission Date: ${record.admissionDate.toLocaleDateString()}`);
      console.log(`      ?? Total Fees: ?${record.totalFees}`);
      console.log(`      ?? Type: ${record.enquiryType}`);
      console.log('');
    });

    console.log('?? Script completed');

  } catch (error) {
    console.error('? Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('?? MongoDB disconnected');
  }
};

// Run the script
connectMongoDB().then(() => {
  checkMonthlyRevenue();
});
