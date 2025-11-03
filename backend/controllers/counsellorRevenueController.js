const Enqure = require('../models/Enqure');
const MonthlyTarget = require('../models/MonthlyTarget');
const User = require('../models/User');

// Get Individual Counsellor Revenue Target Report
exports.getIndividualCounsellorRevenueReport = async (req, res) => {
  try {
    const { counsellorId, startDate, endDate, month, year } = req.query;

    if (!counsellorId) {
      return res.status(400).json({ success: false, message: 'Counsellor ID is required' });
    }

    // Validate counsellor exists
    const counsellor = await User.findById(counsellorId);
    if (!counsellor) {
      return res.status(404).json({ success: false, message: 'Counsellor not found' });
    }

    // Convert counsellorId to ObjectId to ensure proper matching
    const mongoose = require('mongoose');
    const counsellorObjectId = mongoose.Types.ObjectId.isValid(counsellorId) 
      ? new mongoose.Types.ObjectId(counsellorId) 
      : counsellorId;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        admissionDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      dateFilter = {
        admissionDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      dateFilter = {
        admissionDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    }

    // Get target data - find target for the month/year
    let targetQuery = { username: counsellorObjectId };
    if (month && year) {
      const targetDate = new Date(year, month - 1, 1);
      targetQuery.date = {
        $gte: targetDate,
        $lt: new Date(year, month, 1)
      };
    } else if (startDate && endDate) {
      targetQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      targetQuery.date = {
        $gte: startOfMonth,
        $lte: endOfMonth
      };
    }
    
    const targetData = await MonthlyTarget.findOne(targetQuery);
    console.log('Target query:', JSON.stringify(targetQuery));
    console.log('Target data result:', targetData);

    // Debug: Check if counsellor exists in Enqure collection
    const counsellorCheck = await Enqure.findOne({ counsellor: counsellorObjectId });
    console.log('Counsellor check in Enqure:', counsellorCheck ? 'Found' : 'Not found');
    console.log('CounsellorId:', counsellorId);
    console.log('CounsellorObjectId:', counsellorObjectId);
    console.log('Date filter:', JSON.stringify(dateFilter));

    // Get actual revenue data
    const actualData = await Enqure.aggregate([
      {
        $match: {
          counsellor: counsellorObjectId,
          ...dateFilter,
          enquiryType: { $in: ['Admission', 'Registration'] }
        }
      },
      {
        $group: {
          _id: null,
          totalAdmissions: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $add: [
                { $ifNull: ['$admissionAmount', 0] },
                { $ifNull: ['$registrationAmount', 0] }
              ]
            }
          },
          admissionRevenue: { $sum: { $ifNull: ['$admissionAmount', 0] } },
          registrationRevenue: { $sum: { $ifNull: ['$registrationAmount', 0] } }
        }
      }
    ]);
    
    console.log('Actual data result:', actualData);

    // Get course-wise breakdown
    const courseBreakdown = await Enqure.aggregate([
      {
        $match: {
          counsellor: counsellorObjectId,
          ...dateFilter,
          enquiryType: { $in: ['Admission', 'Registration'] }
        }
      },
      {
        $unwind: '$course'
      },
      {
        $group: {
          _id: '$course',
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $add: [
                { $ifNull: ['$admissionAmount', 0] },
                { $ifNull: ['$registrationAmount', 0] }
              ]
            }
          }
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]);

    // Get monthly trend data
    const monthlyTrend = await Enqure.aggregate([
      {
        $match: {
          counsellor: counsellorObjectId,
          admissionDate: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$admissionDate' },
            month: { $month: '$admissionDate' }
          },
          revenue: {
            $sum: {
              $add: [
                { $ifNull: ['$admissionAmount', 0] },
                { $ifNull: ['$registrationAmount', 0] }
              ]
            }
          },
          admissions: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12
      }
    ]);

    const actual = actualData[0] || {
      totalAdmissions: 0,
      totalRevenue: 0,
      admissionRevenue: 0,
      registrationRevenue: 0
    };

    const target = targetData ? targetData.totalRevenue : 0;
    const achievement = target > 0 ? ((actual.totalRevenue / target) * 100).toFixed(2) : 0;
    const remaining = Math.max(0, target - actual.totalRevenue);

    const report = {
      success: true,
      counsellor: {
        _id: counsellor._id,
        name: counsellor.name,
        user_code: counsellor.user_code,
        designation: counsellor.designation,
        department: counsellor.department,
        branch: counsellor.branch
      },
      period: {
        startDate: dateFilter.admissionDate?.$gte || new Date(),
        endDate: dateFilter.admissionDate?.$lte || new Date()
      },
      target: {
        totalRevenue: target,
        courseTargets: targetData?.targets || []
      },
      actual: {
        totalAdmissions: actual.totalAdmissions,
        totalRevenue: actual.totalRevenue,
        admissionRevenue: actual.admissionRevenue,
        registrationRevenue: actual.registrationRevenue
      },
      performance: {
        achievement: parseFloat(achievement),
        remaining: remaining,
        status: parseFloat(achievement) >= 100 ? 'Target Achieved' : 'Target Pending'
      },
      courseBreakdown,
      monthlyTrend,
      summary: {
        totalTargetRevenue: target,
        totalActualRevenue: actual.totalRevenue,
        totalAdmissions: actual.totalAdmissions,
        averageRevenuePerAdmission: actual.totalAdmissions > 0 ? (actual.totalRevenue / actual.totalAdmissions).toFixed(2) : 0
      }
    };

    res.json(report);
  } catch (error) {
    console.error('Error in getIndividualCounsellorRevenueReport:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get Organization-wide Counsellor Revenue Target Report
exports.getOrganizationRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, month, year, department, branch } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        admissionDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      dateFilter = {
        admissionDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      dateFilter = {
        admissionDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    }

    // Build counsellor filter
    let counsellorFilter = {};
    if (department) {
      counsellorFilter.department = department;
    }
    if (branch) {
      counsellorFilter.branch = branch;
    }

         // Get all counsellors - use broader filtering
     let counsellorQuery = {
       status: 'Active'
     };
     
     // Add department filter for counsellors
     if (department) {
       counsellorQuery.department = { $regex: new RegExp(department, 'i') };
     }
     
     // Add branch filter for counsellors
     if (branch) {
       counsellorQuery.branch = { $regex: new RegExp(branch, 'i') };
     }
     
     const allUsers = await User.find(counsellorQuery);
     console.log('All users found:', allUsers.length);
     console.log('Branch filter applied:', branch || 'None');
     
     // More flexible counsellor filtering
     const counsellors = allUsers.filter(user => {
       // Check if user has counsellor-related designation
       const hasCounsellorDesignation = user.designation && 
         user.designation.toLowerCase().includes('counsellor');
       
       // Check if user has counsellor in department array
       const hasCounsellorDepartment = user.department && 
         Array.isArray(user.department) &&
         user.department.some((dept) => 
           dept.toLowerCase().includes('counsellor')
         );
       
       // Check if user has counsellor role
       const hasCounsellorRole = user.role && 
         user.role.toLowerCase().includes('counsellor');
       
       return hasCounsellorDesignation || hasCounsellorDepartment || hasCounsellorRole;
     });
    
    console.log('Organization Report - Found counsellors:', counsellors.length);
    console.log('Date filter:', JSON.stringify(dateFilter));

    // Get organization targets - fix date query
    let targetDateFilter = {};
    if (month && year) {
      const targetDate = new Date(year, month - 1, 1);
      targetDateFilter = {
        $gte: targetDate,
        $lt: new Date(year, month, 1)
      };
    } else if (startDate && endDate) {
      targetDateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      targetDateFilter = {
        $gte: startOfMonth,
        $lte: endOfMonth
      };
    }

    console.log('Target date filter:', JSON.stringify(targetDateFilter));
    
    let organizationTargets = [];
    try {
      organizationTargets = await MonthlyTarget.aggregate([
        {
          $match: {
            date: targetDateFilter
          }
        },
        {
          $group: {
            _id: null,
            totalTargetRevenue: { $sum: '$totalRevenue' },
            totalTargets: { $sum: 1 }
          }
        }
      ]);
    } catch (targetError) {
      console.error('Organization targets aggregation error:', targetError);
      organizationTargets = [];
    }

    // Get organization actual data
    let organizationActual = [];
    try {
      // Build match filter for organization actual data
      let actualMatchFilter = {
        ...dateFilter,
        enquiryType: { $in: ['Admission', 'Registration'] }
      };
      
      // Apply branch filter to actual data if specified
      if (branch) {
        actualMatchFilter.branch = { $regex: new RegExp(branch, 'i') };
      }
      
      organizationActual = await Enqure.aggregate([
        {
          $match: actualMatchFilter
        },
        {
          $group: {
            _id: null,
            totalAdmissions: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $add: [
                  { $ifNull: ['$admissionAmount', 0] },
                  { $ifNull: ['$registrationAmount', 0] }
                ]
              }
            }
          }
        }
      ]);
    } catch (actualError) {
      console.error('Organization actual data aggregation error:', actualError);
      organizationActual = [];
    }

    // Get individual counsellor performance
    const counsellorPerformance = await Promise.all(
      counsellors.map(async (counsellor) => {
        const counsellorTarget = await MonthlyTarget.findOne({
          username: counsellor._id,
          date: targetDateFilter
        });

        const counsellorActual = await Enqure.aggregate([
          {
            $match: {
              counsellor: counsellor._id,
              ...dateFilter,
              enquiryType: { $in: ['Admission', 'Registration'] }
            }
          },
          {
            $group: {
              _id: null,
              totalAdmissions: { $sum: 1 },
              totalRevenue: {
                $sum: {
                  $add: [
                    { $ifNull: ['$admissionAmount', 0] },
                    { $ifNull: ['$registrationAmount', 0] }
                  ]
                }
              }
            }
          }
        ]);

        const actual = counsellorActual[0] || { totalAdmissions: 0, totalRevenue: 0 };
        const target = counsellorTarget ? counsellorTarget.totalRevenue : 0;
        const achievement = target > 0 ? ((actual.totalRevenue / target) * 100).toFixed(2) : 0;

        return {
          counsellor: {
            _id: counsellor._id,
            name: counsellor.name,
            user_code: counsellor.user_code,
            designation: counsellor.designation,
            department: counsellor.department,
            branch: counsellor.branch
          },
          target: target,
          actual: actual.totalRevenue,
          admissions: actual.totalAdmissions,
          achievement: parseFloat(achievement),
          status: parseFloat(achievement) >= 100 ? 'Target Achieved' : 'Target Pending'
        };
      })
    );

    // Get department-wise breakdown
    let deptMatchFilter = {
      ...dateFilter,
      enquiryType: { $in: ['Admission', 'Registration'] }
    };
    
    // Apply branch filter to department breakdown if specified
    if (branch) {
      deptMatchFilter.branch = { $regex: new RegExp(branch, 'i') };
    }
    
    const departmentBreakdown = await Enqure.aggregate([
      {
        $match: deptMatchFilter
      },
      {
        $lookup: {
          from: 'users',
          localField: 'counsellor',
          foreignField: '_id',
          as: 'counsellorData'
        }
      },
      {
        $unwind: '$counsellorData'
      },
      {
        $group: {
          _id: '$counsellorData.department',
          totalRevenue: {
            $sum: {
              $add: [
                { $ifNull: ['$admissionAmount', 0] },
                { $ifNull: ['$registrationAmount', 0] }
              ]
            }
          },
          totalAdmissions: { $sum: 1 },
          counsellorCount: { $addToSet: '$counsellor' }
        }
      },
      {
        $project: {
          department: '$_id',
          totalRevenue: 1,
          totalAdmissions: 1,
          counsellorCount: { $size: '$counsellorCount' }
        }
      }
    ]);

    // Debug: Check if there are any records with course data
    const courseDataCheck = await Enqure.findOne({
      ...dateFilter,
      enquiryType: { $in: ['Admission', 'Registration'] },
      course: { $exists: true, $ne: null, $ne: [] }
    });
    console.log('Course data check:', courseDataCheck ? 'Found records with course data' : 'No records with course data');
    
    // Get course-wise breakdown
    let courseBreakdown = [];
    try {
      let courseMatchFilter = {
        ...dateFilter,
        enquiryType: { $in: ['Admission', 'Registration'] },
        course: { $exists: true, $ne: null }
      };
      
      // Apply branch filter to course breakdown if specified
      if (branch) {
        courseMatchFilter.branch = { $regex: new RegExp(branch, 'i') };
      }
      
      courseBreakdown = await Enqure.aggregate([
        {
          $match: courseMatchFilter
        },
        { $unwind: '$course' },
        { $match: { course: { $ne: null, $ne: '' } } },
        {
          $group: {
            _id: '$course',
            totalRevenue: {
              $sum: {
                $add: [
                  { $ifNull: ['$admissionAmount', 0] },
                  { $ifNull: ['$registrationAmount', 0] }
                ]
              }
            },
            totalAdmissions: { $sum: 1 }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);
    } catch (courseError) {
      console.error('Course breakdown aggregation error:', courseError);
      courseBreakdown = [];
    }
    
    const orgTarget = organizationTargets[0] || { totalTargetRevenue: 0, totalTargets: 0 };
    const orgActual = organizationActual[0] || { totalAdmissions: 0, totalRevenue: 0 };
    const orgAchievement = orgTarget.totalTargetRevenue > 0 ? ((orgActual.totalRevenue / orgTarget.totalTargetRevenue) * 100).toFixed(2) : 0;

    console.log('Organization Report - Course breakdown result:', courseBreakdown);
    console.log('Organization Report - Course breakdown length:', courseBreakdown.length);
    // Debug: Check a few sample records to see course field structure
    const sampleRecords = await Enqure.find({
      ...dateFilter,
      enquiryType: { $in: ['Admission', 'Registration'] }
    }).limit(3);
    console.log('Sample records course field:', sampleRecords.map(r => ({ 
      id: r._id, 
      course: r.course, 
      courseType: typeof r.course,
      isArray: Array.isArray(r.course)
    })));
    console.log('Organization Report - Department breakdown result:', departmentBreakdown);
    console.log('Organization Report - Organization targets result:', organizationTargets);
    console.log('Organization Report - Organization actual result:', organizationActual);
    console.log('Organization Report - Org target amount:', orgTarget.totalTargetRevenue);
    console.log('Organization Report - Org actual amount:', orgActual.totalRevenue);
    console.log('Organization Report - Org achievement:', orgAchievement);
    console.log('Organization Report - Counsellor performance count:', counsellorPerformance.length);
    console.log('Organization Report - Counsellor performance sample:', counsellorPerformance.slice(0, 3).map(c => ({
      name: c.counsellor.name,
      actual: c.actual,
      achievement: c.achievement,
      status: c.status
    })));
    // Debug: Check top performers filtering
    const topPerformersFiltered = counsellorPerformance.filter(c => c.actual > 0);
    console.log('Top performers filtered count:', topPerformersFiltered.length);
    console.log('Top performers sample:', topPerformersFiltered.slice(0, 3).map(c => ({
      name: c.counsellor.name,
      actual: c.actual,
      achievement: c.achievement
    })));

    const report = {
      success: true,
      period: {
        startDate: dateFilter.admissionDate?.$gte || new Date(),
        endDate: dateFilter.admissionDate?.$lte || new Date()
      },
      filters: {
        department: department || 'All',
        branch: branch || 'All'
      },
      organization: {
        totalTargetRevenue: orgTarget.totalTargetRevenue,
        totalActualRevenue: orgActual.totalRevenue,
        totalAdmissions: orgActual.totalAdmissions,
        achievement: parseFloat(orgAchievement),
        status: parseFloat(orgAchievement) >= 100 ? 'Target Achieved' : 'Target Pending'
      },
      summary: {
        totalCounsellors: counsellors.length,
        targetAchievedCount: counsellorPerformance.filter(c => c.status === 'Target Achieved').length,
        targetPendingCount: counsellorPerformance.filter(c => c.status === 'Target Pending').length,
        averageAchievement: counsellorPerformance.length > 0 ? 
          (counsellorPerformance.reduce((sum, c) => sum + c.achievement, 0) / counsellorPerformance.length).toFixed(2) : 0
      },
      counsellors: counsellorPerformance.sort((a, b) => b.achievement - a.achievement),
      departmentBreakdown,
      courseBreakdown,
             topPerformers: counsellorPerformance
         .filter(c => c.actual > 0) // Show counsellors who have actual revenue
         .sort((a, b) => b.achievement - a.achievement)
         .slice(0, 5)
    };

    res.json(report);
  } catch (error) {
    console.error('Error in getOrganizationRevenueReport:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message,
      stack: error.stack
    });
  }
};

// Get Revenue Target Summary for Dashboard
exports.getRevenueTargetSummary = async (req, res) => {
  try {
    const { counsellorId } = req.query;

    if (!counsellorId) {
      return res.status(400).json({ success: false, message: 'Counsellor ID is required' });
    }

    // Get current month data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get target
    const target = await MonthlyTarget.findOne({
      username: counsellorId,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    // Get actual revenue
    const actual = await Enqure.aggregate([
      {
        $match: {
          counsellor: counsellorId,
          admissionDate: {
            $gte: startOfMonth,
            $lte: endOfMonth
          },
          enquiryType: { $in: ['Admission', 'Registration'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $add: [
                { $ifNull: ['$admissionAmount', 0] },
                { $ifNull: ['$registrationAmount', 0] }
              ]
            }
          }
        }
      }
    ]);

    const targetAmount = target ? target.totalRevenue : 0;
    const actualAmount = actual[0] ? actual[0].totalRevenue : 0;
    const remaining = Math.max(0, targetAmount - actualAmount);
    const achievement = targetAmount > 0 ? ((actualAmount / targetAmount) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      target: targetAmount,
      actual: actualAmount,
      remaining: remaining,
      achievement: parseFloat(achievement)
    });
  } catch (error) {
    console.error('Error in getRevenueTargetSummary:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all counsellors for dropdown
exports.getAllCounsellors = async (req, res) => {
  try {
    // Search by designation instead of role since 'Counsellor' is not in the role enum
    const counsellors = await User.find({ 
      $or: [
        { designation: { $regex: /counsellor/i } },
        { role: 'Counsellor' }
      ]
    })
      .select('_id name user_code designation department branch')
      .sort({ name: 1 });

    res.json({
      success: true,
      counsellors: counsellors
    });
  } catch (error) {
    console.error('Error in getAllCounsellors:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Debug endpoint to check course data
exports.debugCourseData = async (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        admissionDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      dateFilter = {
        admissionDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      dateFilter = {
        admissionDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    }

    // Get all records with course data
    const allRecords = await Enqure.find({
      ...dateFilter,
      enquiryType: { $in: ['Admission', 'Registration'] }
    }).limit(10);

    // Get records with non-empty course
    const recordsWithCourse = await Enqure.find({
      ...dateFilter,
      enquiryType: { $in: ['Admission', 'Registration'] },
      course: { $exists: true, $ne: null }
    }).limit(10);

    // Get records with empty course array
    const recordsWithEmptyCourse = await Enqure.find({
      ...dateFilter,
      enquiryType: { $in: ['Admission', 'Registration'] },
      course: { $size: 0 }
    }).limit(5);

    // Get records with null course
    const recordsWithNullCourse = await Enqure.find({
      ...dateFilter,
      enquiryType: { $in: ['Admission', 'Registration'] },
      course: null
    }).limit(5);

    // Get records without course field
    const recordsWithoutCourse = await Enqure.find({
      ...dateFilter,
      enquiryType: { $in: ['Admission', 'Registration'] },
      course: { $exists: false }
    }).limit(5);

    // Count totals
    const totalRecords = await Enqure.countDocuments({
      ...dateFilter,
      enquiryType: { $in: ['Admission', 'Registration'] }
    });

    const totalWithCourse = await Enqure.countDocuments({
      ...dateFilter,
      enquiryType: { $in: ['Admission', 'Registration'] },
      course: { $exists: true, $ne: null, $not: { $size: 0 } }
    });

    res.json({
      success: true,
      dateFilter,
      counts: {
        totalRecords,
        totalWithCourse,
        recordsWithCourse: recordsWithCourse.length,
        recordsWithEmptyCourse: recordsWithEmptyCourse.length,
        recordsWithNullCourse: recordsWithNullCourse.length,
        recordsWithoutCourse: recordsWithoutCourse.length
      },
      sampleData: {
        allRecords: allRecords.map(r => ({
          id: r._id,
          studentName: r.studentName,
          course: r.course,
          courseType: typeof r.course,
          isArray: Array.isArray(r.course),
          courseLength: Array.isArray(r.course) ? r.course.length : 'N/A',
          admissionAmount: r.admissionAmount,
          registrationAmount: r.registrationAmount,
          admissionDate: r.admissionDate,
          enquiryType: r.enquiryType
        })),
        recordsWithCourse: recordsWithCourse.map(r => ({
          id: r._id,
          studentName: r.studentName,
          course: r.course,
          courseLength: r.course.length,
          admissionAmount: r.admissionAmount,
          registrationAmount: r.registrationAmount
        })),
        recordsWithEmptyCourse: recordsWithEmptyCourse.map(r => ({
          id: r._id,
          studentName: r.studentName,
          course: r.course,
          courseLength: r.course.length
        })),
        recordsWithNullCourse: recordsWithNullCourse.map(r => ({
          id: r._id,
          studentName: r.studentName,
          course: r.course
        })),
        recordsWithoutCourse: recordsWithoutCourse.map(r => ({
          id: r._id,
          studentName: r.studentName,
          hasCourseField: 'course' in r
        }))
      }
    });
  } catch (error) {
    console.error('Error in debugCourseData:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}; 