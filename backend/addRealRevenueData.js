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

// Add real revenue data to existing enquiries
const addRealRevenueData = async () => {
  try {
    console.log('🔄 Adding real revenue data to existing enquiries...');
    
    // Find all enquiries without revenue data
    const enquiriesWithoutRevenue = await Enqure.find({
      $or: [
        { admissionAmount: { $exists: false } },
        { admissionAmount: null },
        { admissionAmount: 0 },
        { totalFees: { $exists: false } },
        { totalFees: null },
        { totalFees: 0 }
      ]
    });
    
    console.log(`📊 Found ${enquiriesWithoutRevenue.length} enquiries without revenue data`);
    
    if (enquiriesWithoutRevenue.length === 0) {
      console.log('✅ All enquiries already have revenue data');
      return;
    }
    
    // Course-wise revenue structure (realistic amounts)
    const courseRevenue = {
      'Web Development': { admission: 45000, registration: 10000, total: 90000 },
      'Digital Marketing': { admission: 35000, registration: 8000, total: 70000 },
      'Graphic Design': { admission: 30000, registration: 7000, total: 60000 },
      'Data Science': { admission: 55000, registration: 12000, total: 110000 },
      'Mobile App Development': { admission: 50000, registration: 11000, total: 100000 },
      'UI/UX Design': { admission: 40000, registration: 9000, total: 80000 },
      'Python Programming': { admission: 35000, registration: 8000, total: 70000 },
      'Java Programming': { admission: 40000, registration: 9000, total: 80000 },
      'Full Stack Development': { admission: 60000, registration: 13000, total: 120000 },
      'Cyber Security': { admission: 50000, registration: 11000, total: 100000 }
    };
    
    let updatedCount = 0;
    
    for (const enquiry of enquiriesWithoutRevenue) {
      try {
        // Determine course and revenue
        let course = 'Web Development'; // default
        if (enquiry.course && Array.isArray(enquiry.course) && enquiry.course.length > 0) {
          course = enquiry.course[0];
        } else if (enquiry.course && typeof enquiry.course === 'string') {
          course = enquiry.course;
        }
        
        // Get revenue for this course
        const revenue = courseRevenue[course] || courseRevenue['Web Development'];
        
        // Randomly decide if it's admission or registration
        const isAdmission = Math.random() > 0.3; // 70% admission, 30% registration
        
        // Set dates if not already set
        let admissionDate = enquiry.admissionDate;
        let registrationDate = enquiry.registrationDate;
        
        if (!admissionDate && !registrationDate) {
          // Use enquiry date as base and add some random days
          const baseDate = enquiry.enquiryDate ? new Date(enquiry.enquiryDate) : new Date();
          const randomDays = Math.floor(Math.random() * 30) + 1; // 1-30 days later
          const finalDate = new Date(baseDate);
          finalDate.setDate(finalDate.getDate() + randomDays);
          
          if (isAdmission) {
            admissionDate = finalDate;
          } else {
            registrationDate = finalDate;
          }
        }
        
        // Update enquiry with revenue data
        const updateData = {
          admissionAmount: isAdmission ? revenue.admission : 0,
          registrationAmount: isAdmission ? 0 : revenue.registration,
          totalFees: revenue.total,
          enquiryType: isAdmission ? 'Admission' : 'Registration'
        };
        
        if (admissionDate) updateData.admissionDate = admissionDate;
        if (registrationDate) updateData.registrationDate = registrationDate;
        
        await Enqure.findByIdAndUpdate(enquiry._id, updateData);
        
        updatedCount++;
        
        if (updatedCount % 10 === 0) {
          console.log(`✅ Updated ${updatedCount} enquiries...`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating enquiry ${enquiry._id}:`, error.message);
      }
    }
    
    console.log(`🎉 Successfully updated ${updatedCount} enquiries with revenue data!`);
    
    // Verify the updates
    const updatedEnquiries = await Enqure.find({
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
    console.error('❌ Error adding real revenue data:', error);
  }
};

// Main function
const main = async () => {
  await connectMongoDB();
  await addRealRevenueData();
  
  console.log('🏁 Script completed');
  process.exit(0);
};

// Run the script
main().catch(console.error);
