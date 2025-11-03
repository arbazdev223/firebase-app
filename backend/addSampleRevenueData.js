const mongoose = require('mongoose');
const Enqure = require('./models/Enqure');

// MongoDB connection
const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/instituteDB';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Add sample revenue data to admitted enquiries with proper dates
const addSampleRevenueData = async () => {
  try {
    console.log('🔄 Adding sample revenue data with dates...');
    
    // Generate dates for the last 6 months
    const dates = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      // Random day in the month
      const randomDay = Math.floor(Math.random() * 28) + 1;
      date.setDate(randomDay);
      dates.push(date);
    }
    
    console.log('📅 Generated dates:', dates.map(d => d.toLocaleDateString()));
    
    // Find admitted enquiries without revenue data
    const admittedEnquiries = await Enqure.find({
      enquiryType: { $in: ['Admission', 'Registration'] },
      $or: [
        { admissionAmount: { $exists: false } },
        { admissionAmount: null },
        { admissionAmount: 0 },
        { totalFees: { $exists: false } },
        { totalFees: null },
        { totalFees: 0 }
      ]
    }).limit(30); // Update more records for better testing
    
    console.log(`📊 Found ${admittedEnquiries.length} enquiries without revenue data`);
    
    if (admittedEnquiries.length === 0) {
      console.log('✅ All enquiries already have revenue data');
      return;
    }
    
    // Sample revenue data with varying amounts
    const sampleRevenueData = [
      { admissionAmount: 50000, registrationAmount: 10000, totalFees: 100000 },
      { admissionAmount: 75000, registrationAmount: 15000, totalFees: 150000 },
      { admissionAmount: 60000, registrationAmount: 12000, totalFees: 120000 },
      { admissionAmount: 80000, registrationAmount: 16000, totalFees: 160000 },
      { admissionAmount: 45000, registrationAmount: 9000, totalFees: 90000 },
      { admissionAmount: 65000, registrationAmount: 13000, totalFees: 130000 },
      { admissionAmount: 70000, registrationAmount: 14000, totalFees: 140000 },
      { admissionAmount: 55000, registrationAmount: 11000, totalFees: 110000 },
      { admissionAmount: 90000, registrationAmount: 18000, totalFees: 180000 },
      { admissionAmount: 40000, registrationAmount: 8000, totalFees: 80000 },
      { admissionAmount: 85000, registrationAmount: 17000, totalFees: 170000 },
      { admissionAmount: 35000, registrationAmount: 7000, totalFees: 70000 },
      { admissionAmount: 95000, registrationAmount: 19000, totalFees: 190000 },
      { admissionAmount: 30000, registrationAmount: 6000, totalFees: 60000 },
      { admissionAmount: 100000, registrationAmount: 20000, totalFees: 200000 }
    ];
    
    // Update enquiries with sample revenue data and dates
    for (let i = 0; i < Math.min(admittedEnquiries.length, 30); i++) {
      const enquiry = admittedEnquiries[i];
      const revenueData = sampleRevenueData[i % sampleRevenueData.length];
      const dateIndex = Math.floor(i / 5); // Distribute across months
      const selectedDate = dates[dateIndex] || dates[0];
      
      // Randomly choose between admission and registration
      const isAdmission = Math.random() > 0.3; // 70% admission, 30% registration
      
      const updateData = {
        admissionAmount: revenueData.admissionAmount,
        registrationAmount: revenueData.registrationAmount,
        totalFees: revenueData.totalFees,
        enquiryType: isAdmission ? 'Admission' : 'Registration'
      };
      
      if (isAdmission) {
        updateData.admissionDate = selectedDate;
      } else {
        updateData.registrationDate = selectedDate;
      }
      
      await Enqure.findByIdAndUpdate(enquiry._id, updateData);
      
      console.log(`✅ Updated enquiry: ${enquiry.studentName || enquiry._id} with ${isAdmission ? 'admission' : 'registration'} data for ${selectedDate.toLocaleDateString()}`);
    }
    
    console.log('🎉 Sample revenue data with dates added successfully!');
    
    // Verify the updates
    const updatedEnquiries = await Enqure.find({
      enquiryType: { $in: ['Admission', 'Registration'] },
      $or: [
        { admissionAmount: { $gt: 0 } },
        { registrationAmount: { $gt: 0 } },
        { totalFees: { $gt: 0 } }
      ]
    });
    
    console.log(`📈 Total enquiries with revenue data: ${updatedEnquiries.length}`);
    
    // Calculate total revenue
    const totalRevenue = updatedEnquiries.reduce((sum, enquiry) => {
      const admissionAmount = parseFloat(enquiry.admissionAmount || '0') || 0;
      const registrationAmount = parseFloat(enquiry.registrationAmount || '0') || 0;
      const totalFees = parseFloat(enquiry.totalFees || '0') || 0;
      return sum + admissionAmount + registrationAmount + totalFees;
    }, 0);
    
    console.log(`💰 Total Revenue: ₹${totalRevenue.toLocaleString()}`);
    
    // Show monthly breakdown
    console.log('\n📊 Monthly Revenue Breakdown:');
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      
      const monthEnquiries = updatedEnquiries.filter(enquiry => {
        const admissionDate = enquiry.admissionDate ? new Date(enquiry.admissionDate) : null;
        const registrationDate = enquiry.registrationDate ? new Date(enquiry.registrationDate) : null;
        
        return (admissionDate && admissionDate >= startOfMonth && admissionDate <= endOfMonth) ||
               (registrationDate && registrationDate >= startOfMonth && registrationDate <= endOfMonth);
      });
      
      const monthRevenue = monthEnquiries.reduce((sum, enquiry) => {
        const admissionAmount = parseFloat(enquiry.admissionAmount || '0') || 0;
        const registrationAmount = parseFloat(enquiry.registrationAmount || '0') || 0;
        const totalFees = parseFloat(enquiry.totalFees || '0') || 0;
        return sum + admissionAmount + registrationAmount + totalFees;
      }, 0);
      
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      console.log(`${monthName}: ₹${monthRevenue.toLocaleString()} (${monthEnquiries.length} records)`);
    }
    
  } catch (error) {
    console.error('❌ Error adding sample revenue data:', error);
  }
};

// Main function
const main = async () => {
  await connectMongoDB();
  await addSampleRevenueData();
  
  console.log('🏁 Script completed');
  process.exit(0);
};

// Run the script
main().catch(console.error);
