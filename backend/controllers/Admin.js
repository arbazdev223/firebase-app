const CircularNotification = require('../models/CircularNotification');
const Enqure = require('../models/Enqure');
const User = require('../models/User');
const MonthlyTarget = require('../models/MonthlyTarget');

// Controller to create a new circular notification
exports.createCircularNotification = async (req, res) => {
  try {
    const { topicHeading, shareMembers, branch, circular, content } = req.body;

    // Create a new circular notification document
    const newCircularNotification = new CircularNotification({
      topicHeading,
      shareMembers,
      branch,
      circular,
      content,
    });

    // Save the notification in the database
    const savedNotification = await newCircularNotification.save();

    return res.status(201).json({
      message: 'Circular notification created successfully!',
      data: savedNotification,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error creating circular notification',
      error: error.message,
    });
  }
};

// Controller to fetch all circular notifications
exports.getAllCircularNotifications = async (req, res) => {
  try {
    const notifications = await CircularNotification.find().sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Circular notifications fetched successfully!',
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error fetching circular notifications',
      error: error.message,
    });
  }
};

// Alias for getAllCircularNotifications (for backward compatibility)
exports.getCircularNotifications = exports.getAllCircularNotifications;

// Controller to fetch a single circular notification by ID
exports.getCircularNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await CircularNotification.findById(id);

    if (!notification) {
      return res.status(404).json({
        message: 'Circular notification not found',
      });
    }

    return res.status(200).json({
      message: 'Circular notification fetched successfully!',
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error fetching circular notification',
      error: error.message,
    });
  }
};

// Controller to update a circular notification
exports.updateCircularNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { topicHeading, shareMembers, branch, circular, content } = req.body;

    const updatedNotification = await CircularNotification.findByIdAndUpdate(
      id,
      { topicHeading, shareMembers, branch, circular, content },
      { new: true, runValidators: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({
        message: 'Circular notification not found',
      });
    }

    return res.status(200).json({
      message: 'Circular notification updated successfully!',
      data: updatedNotification,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error updating circular notification',
      error: error.message,
    });
  }
};

// Controller to delete a circular notification
exports.deleteCircularNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedNotification = await CircularNotification.findByIdAndDelete(id);

    if (!deletedNotification) {
      return res.status(404).json({
        message: 'Circular notification not found',
      });
    }

    return res.status(200).json({
      message: 'Circular notification deleted successfully!',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error deleting circular notification',
      error: error.message,
    });
  }
};

// Get Admin Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        console.log('Admin Dashboard Stats API called');
        
        // Get total students from LMS API or calculate from admitted enquiries
        let totalStudents = 0;
        try {
            const lmsResponse = await fetch('https://lms.ifda.in/api/v1/students');
            if (lmsResponse.ok) {
                const lmsData = await lmsResponse.json();
                totalStudents = lmsData?.data?.length || 0;
            }
        } catch (error) {
            console.log('LMS API failed, calculating from admitted enquiries');
            const admittedEnquiries = await Enqure.find({ 
                enquiryType: 'Admission'
            });
            totalStudents = admittedEnquiries.length;
        }

        // Get total enquiries
        const totalEnquiries = await Enqure.countDocuments();

        // Get total calls (enquiries with callingDate)
        const totalCalls = await Enqure.countDocuments({ callingDate: { $exists: true, $ne: null } });

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's stats
        const todayEnquiries = await Enqure.countDocuments({
            enquiryDate: { $gte: today, $lt: tomorrow }
        });

        const todayCalls = await Enqure.countDocuments({
            callingDate: { $gte: today, $lt: tomorrow }
        });

        const todayAdmissions = await Enqure.countDocuments({
            enquiryType: 'Admission',
            $or: [
                { admissionDate: { $gte: today, $lt: tomorrow } },
                { enquiryDate: { $gte: today, $lt: tomorrow } }
            ]
        });

        const response = {
            success: true,
            data: {
                totalStudents,
                totalEnquiries,
                totalCalls,
                todayEnquiries,
                todayCalls,
                todayAdmissions
            }
        };

        console.log('Admin Dashboard Stats:', response.data);
        res.json(response);

    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message
        });
    }
};

// Get Revenue Stats
exports.getRevenueStats = async (req, res) => {
    try {
        console.log('Admin Revenue Stats API called');

        // Get all enquiries with admission amount data
        const revenueEnquiries = await Enqure.find({
            admissionAmount: { $exists: true, $ne: null, $ne: 0 }
        });

        // Calculate total revenue from admission amount only
        let totalRevenue = 0;
        let sampleEnquiry = null;
        
        for (const enquiry of revenueEnquiries) {
            const admissionAmount = parseFloat(enquiry.admissionAmount || '0') || 0;
            
            if (!sampleEnquiry) {
                sampleEnquiry = {
                    id: enquiry._id,
                    admissionAmount,
                    status: enquiry.status
                };
            }
            
            totalRevenue += admissionAmount;
        }
        
        console.log('Revenue Calculation Debug:', {
            totalRevenueEnquiries: revenueEnquiries.length,
            sampleEnquiry,
            totalRevenue
        });

        // Get today's revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayRevenueEnquiries = revenueEnquiries.filter(enquiry => {
            const admissionDate = enquiry.admissionDate ? new Date(enquiry.admissionDate) : new Date(enquiry.enquiryDate);
            return admissionDate >= today && admissionDate < tomorrow;
        });

        const todayRevenue = todayRevenueEnquiries.reduce((sum, enquiry) => {
            const admissionAmount = parseFloat(enquiry.admissionAmount || '0') || 0;
            return sum + admissionAmount;
        }, 0);

        const response = {
            success: true,
            data: {
                totalRevenue,
                todayRevenue
            }
        };

        console.log('Admin Revenue Stats:', response.data);
        res.json(response);

    } catch (error) {
        console.error('Error in getRevenueStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching revenue stats',
            error: error.message
        });
    }
};

// Get Student Stats
exports.getStudentStats = async (req, res) => {
    try {
        console.log('Admin Student Stats API called');

        // Get total students from LMS API
        let totalStudents = 0;
        try {
            const lmsResponse = await fetch('https://lms.ifda.in/api/v1/students');
            if (lmsResponse.ok) {
                const lmsData = await lmsResponse.json();
                totalStudents = lmsData?.data?.length || 0;
            }
        } catch (error) {
            console.log('LMS API failed, using admitted enquiries count');
            const admittedEnquiries = await Enqure.find({ 
                enquiryType: 'Admission'
            });
            totalStudents = admittedEnquiries.length;
        }

        // Get today's admissions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAdmissions = await Enqure.countDocuments({
            enquiryType: 'Admission',
            $or: [
                { admissionDate: { $gte: today, $lt: tomorrow } },
                { enquiryDate: { $gte: today, $lt: tomorrow } }
            ]
        });

        const response = {
            success: true,
            data: {
                totalStudents,
                todayAdmissions
            }
        };

        console.log('Admin Student Stats:', response.data);
        res.json(response);

    } catch (error) {
        console.error('Error in getStudentStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student stats',
            error: error.message
        });
    }
};

// Get Today's Stats
exports.getTodayStats = async (req, res) => {
    try {
        console.log('Admin Today Stats API called');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's enquiries
        const todayEnquiries = await Enqure.countDocuments({
            enquiryDate: { $gte: today, $lt: tomorrow }
        });

        // Get today's calls
        const todayCalls = await Enqure.countDocuments({
            callingDate: { $gte: today, $lt: tomorrow }
        });

        // Get today's admissions
        const todayAdmissions = await Enqure.countDocuments({
            enquiryType: 'Admission',
            $or: [
                { admissionDate: { $gte: today, $lt: tomorrow } },
                { enquiryDate: { $gte: today, $lt: tomorrow } }
            ]
        });

        // Get today's revenue
        const todayRevenueEnquiries = await Enqure.find({
            $or: [
                { admissionAmount: { $exists: true, $ne: null, $ne: 0 } },
                { registrationAmount: { $exists: true, $ne: null, $ne: 0 } },
                { totalFees: { $exists: true, $ne: null, $ne: 0 } }
            ],
            $or: [
                { admissionDate: { $gte: today, $lt: tomorrow } },
                { enquiryDate: { $gte: today, $lt: tomorrow } }
            ]
        });

        const todayRevenue = todayRevenueEnquiries.reduce((sum, enquiry) => {
            const admissionAmount = parseFloat(enquiry.admissionAmount || '0') || 0;
            const registrationAmount = parseFloat(enquiry.registrationAmount || '0') || 0;
            const totalFees = parseFloat(enquiry.totalFees || '0') || 0;
            return sum + admissionAmount + registrationAmount + totalFees;
        }, 0);

        const response = {
            success: true,
            data: {
                todayEnquiries,
                todayCalls,
                todayAdmissions,
                todayRevenue
            }
        };

        console.log('Admin Today Stats:', response.data);
        res.json(response);

    } catch (error) {
        console.error('Error in getTodayStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching today stats',
            error: error.message
        });
    }
};

// Get Enquiry Sources Stats for Chart
exports.getEnquirySourcesStats = async (req, res) => {
    try {
        console.log('Admin Enquiry Sources Stats API called');

        // Get enquiry sources distribution
        const sourcesStats = await Enqure.aggregate([
            {
                $group: {
                    _id: '$source',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Format data for chart
        const labels = sourcesStats.map(item => item._id || 'Unknown');
        const series = sourcesStats.map(item => item.count);

        const response = {
            success: true,
            data: {
                labels,
                series
            }
        };

        console.log('Admin Enquiry Sources Stats:', response.data);
        res.json(response);

    } catch (error) {
        console.error('Error in getEnquirySourcesStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching enquiry sources stats',
            error: error.message
        });
    }
};

// Get Monthly Attendance Stats for Chart
exports.getMonthlyAttendanceStats = async (req, res) => {
    try {
        console.log('Admin Monthly Attendance Stats API called');

        const months = [];
        const attendanceData = [];

        // Get last 6 months data
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
            
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            months.push(monthName);

            // Get attendance for this month (sample data - replace with real logic)
            const monthlyAttendance = Math.floor(Math.random() * 20) + 80; // 80-100% range
            attendanceData.push(monthlyAttendance);
        }

        const response = {
            success: true,
            data: {
                months,
                attendance: attendanceData
            }
        };

        console.log('Admin Monthly Attendance Stats:', response.data);
        res.json(response);

    } catch (error) {
        console.error('Error in getMonthlyAttendanceStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly attendance stats',
            error: error.message
        });
    }
};

// Get Monthly Revenue Stats for Graph
exports.getMonthlyRevenueStats = async (req, res) => {
    try {
        console.log('Admin Monthly Revenue Stats API called');

        const months = [];
        const revenueData = [];

        // Get last 6 months data
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
            
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            months.push(monthName);

            // Get revenue for this month - only Admission enquiries with admissionDate and admissionAmount
            const monthlyRevenue = await Enqure.aggregate([
                {
                    $match: {
                        enquiryType: 'Admission',
                        admissionDate: { 
                            $gte: startOfMonth, 
                            $lte: endOfMonth,
                            $ne: null 
                        },
                        admissionAmount: { $exists: true, $ne: null, $ne: 0 }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: {
                            $sum: { $ifNull: ['$admissionAmount', 0] }
                        },
                        count: { $sum: 1 }
                    }
                }
            ]);

            const revenue = monthlyRevenue.length > 0 ? monthlyRevenue[0].totalRevenue : 0;
            revenueData.push(revenue);
            
            console.log(`Month: ${monthName}, Revenue: ${revenue}, Records: ${monthlyRevenue.length > 0 ? monthlyRevenue[0].count : 0}`);
        }

        // Debug: Check if we have any admission revenue data at all
        const totalAdmissionEnquiries = await Enqure.countDocuments({
            enquiryType: 'Admission',
            admissionDate: { $exists: true, $ne: null },
            admissionAmount: { $exists: true, $ne: null, $ne: 0 }
        });

        const totalAdmissionRevenue = await Enqure.aggregate([
            {
                $match: {
                    enquiryType: 'Admission',
                    admissionDate: { $exists: true, $ne: null },
                    admissionAmount: { $exists: true, $ne: null, $ne: 0 }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: { $ifNull: ['$admissionAmount', 0] }
                    }
                }
            }
        ]);

        console.log('Debug Info:', {
            totalAdmissionEnquiries,
            totalAdmissionRevenue: totalAdmissionRevenue.length > 0 ? totalAdmissionRevenue[0].totalRevenue : 0,
            monthlyData: revenueData
        });

        const response = {
            success: true,
            data: {
                months,
                revenue: revenueData
            }
        };

        console.log('Admin Monthly Revenue Stats:', response.data);
        console.log('Debug - API Response:', {
            months: response.data.months,
            revenue: response.data.revenue,
            totalMonths: response.data.months.length,
            totalRevenuePoints: response.data.revenue.length
        });
        res.json(response);

    } catch (error) {
        console.error('Error in getMonthlyRevenueStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly revenue stats',
            error: error.message
        });
    }
};

// Get Student Course Distribution Stats
exports.getStudentCourseDistribution = async (req, res) => {
    try {
        console.log('Admin Student Course Distribution API called');

        // Get real course distribution from database
        const courseDistribution = await Enqure.aggregate([
            {
                $match: {
                    enquiryType: 'Admission',
                    course: { $exists: true, $ne: null }
                }
            },
            {
                $unwind: '$course'
            },
            {
                $group: {
                    _id: '$course',
                    students: { $sum: 1 }
                }
            },
            {
                $sort: { students: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // Format data for chart
        const courseData = courseDistribution.map(item => ({
            name: item._id || 'Unknown Course',
            students: item.students
        }));

        const response = {
            success: true,
            data: courseData
        };

        console.log('Admin Student Course Distribution:', response.data);
        res.json(response);

    } catch (error) {
        console.error('Error in getStudentCourseDistribution:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student course distribution',
            error: error.message
        });
    }
};

// Get Enquiry Report
exports.getEnquiryReport = async (req, res) => {
    try {
        console.log('Admin Enquiry Report API called');
        
        const {
            page = 1,
            limit = 50,
            startDate,
            endDate,
            enquiryType,
            status,
            source,
            course,
            counsellor,
            search
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (startDate && endDate) {
            filter.enquiryDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        if (enquiryType) filter.enquiryType = enquiryType;
        if (status) filter.leadStatus = status;
        if (source) filter.source = source;
        if (course) filter.course = { $in: [course] };
        if (counsellor) filter['counsellor.name'] = { $regex: counsellor, $options: 'i' };
        
        if (search) {
            filter.$or = [
                { studentName: { $regex: search, $options: 'i' } },
                { studentMobile: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate skip value for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query with pagination
        const enquiries = await Enqure.find(filter)
            .populate('counsellor', 'name email')
            .sort({ enquiryDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalCount = await Enqure.countDocuments(filter);

        const response = {
            success: true,
            data: enquiries,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                limit: parseInt(limit)
            }
        };

        console.log('Admin Enquiry Report:', response.data.length, 'enquiries found');
        res.json(response);

    } catch (error) {
        console.error('Error in getEnquiryReport:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching enquiry report',
            error: error.message
        });
    }
};

// Export Enquiry Report
exports.exportEnquiryReport = async (req, res) => {
    try {
        console.log('Admin Export Enquiry Report API called');
        
        const {
            startDate,
            endDate,
            enquiryType,
            status,
            source,
            course,
            counsellor,
            search,
            format = 'csv'
        } = req.body;

        // Build filter object (same as getEnquiryReport)
        const filter = {};
        
        if (startDate && endDate) {
            filter.enquiryDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        if (enquiryType) filter.enquiryType = enquiryType;
        if (status) filter.leadStatus = status;
        if (source) filter.source = source;
        if (course) filter.course = { $in: [course] };
        if (counsellor) filter['counsellor.name'] = { $regex: counsellor, $options: 'i' };
        
        if (search) {
            filter.$or = [
                { studentName: { $regex: search, $options: 'i' } },
                { studentMobile: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Get all enquiries matching the filter
        const enquiries = await Enqure.find(filter)
            .populate('counsellor', 'name email')
            .sort({ enquiryDate: -1 });

        if (format === 'csv') {
            // Generate CSV
            const headers = ['Student Name', 'Mobile', 'Course', 'Type', 'Status', 'Source', 'Counsellor', 'Revenue', 'Date'];
            const csvContent = [
                headers.join(','),
                ...enquiries.map(enquiry => [
                    `"${enquiry.studentName || ''}"`,
                    `"${enquiry.studentMobile || ''}"`,
                    `"${Array.isArray(enquiry.course) ? enquiry.course.join('; ') : enquiry.course || ''}"`,
                    `"${enquiry.enquiryType || ''}"`,
                    `"${enquiry.leadStatus || enquiry.assign || ''}"`,
                    `"${enquiry.source || ''}"`,
                    `"${enquiry.counsellor?.name || 'N/A'}"`,
                    enquiry.totalFees || 0,
                    `"${enquiry.enquiryDate ? new Date(enquiry.enquiryDate).toLocaleDateString() : ''}"`
                ].join(','))
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=enquiry-report-${new Date().toISOString().split('T')[0]}.csv`);
            res.send(csvContent);
        } else {
            // Return JSON
            res.json({
                success: true,
                data: enquiries,
                count: enquiries.length
            });
        }

    } catch (error) {
        console.error('Error in exportEnquiryReport:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting enquiry report',
            error: error.message
        });
    }
};
