const attendanceModel = require('../models/attendanceModel');
const moment = require('moment-timezone');
const Attendance = require('../models/Attendance');

exports.getAttendanceData = async (req, res) => {
  try {
    const attendanceData = await attendanceModel.getAllAttendance();

    // Convert 'logIn' times to IST
    const convertedData = attendanceData.map(entry => ({
      ...entry,
      logIn: moment(entry.logIn).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')
    }));

    res.status(200).json({ success: true, data: convertedData });
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    res.status(500).json({ success: false, message: 'Error fetching attendance data' });
  }
};

exports.getAllDailyAttendance = async (req, res) => {
  try {
    const { startDate, endDate, status, branch, search } = req.query;
    
    console.log('Query params:', { startDate, endDate, status, branch, search });
    
    // Build filter object
    const filter = {};
    
    // Date range filter with proper timezone handling
    if (startDate || endDate) {
      filter.attendance_date = {};
      if (startDate) {
        // Start of day in IST
        const startDateTime = new Date(startDate + 'T00:00:00.000+05:30');
        filter.attendance_date.$gte = startDateTime;
        console.log('Start date filter:', startDateTime);
      }
      if (endDate) {
        // End of day in IST
        const endDateTime = new Date(endDate + 'T23:59:59.999+05:30');
        filter.attendance_date.$lte = endDateTime;
        console.log('End date filter:', endDateTime);
      }
    }
    
    // Status filter
    if (status) {
      filter.status = status;
    }
    
    // Branch filter
    if (branch) {
      filter.branch = branch;
    }
    
    // Search filter (for user name)
    if (search) {
      // We'll handle search after population
    }
    
    console.log('MongoDB filter:', JSON.stringify(filter, null, 2));
    
    // Populate user name, office timing, designation, phone, and branch name
    const records = await Attendance.find(filter)
      .sort({ attendance_date: -1 })
      .populate({
        path: 'user_id',
        select: 'name user_code branches designation phone_number status', // <-- Add user_code here
        match: { status: 'Active' },
      });

    console.log('Found records:', records.length);

    // Map to include user name, office timing, designation, phone, and branch name
    let data = records.filter(rec => rec.user_id)
      .map((rec) => {
        try {
          let officeTiming = '';
          let branchName = rec.branch || '';
          let designation = '';
          let phone_number = '';
          
          if (rec.user_id) {
            designation = rec.user_id.designation || '';
            phone_number = rec.user_id.phone_number || '';
            
            // Debug branch matching
            console.log(`User: ${rec.user_id.name}, Attendance Branch: ${rec.branch}, User Branches:`, rec.user_id.branches);
            
            if (rec.user_id.branches && rec.branch) {
              // Try exact match first
              let branchInfo = rec.user_id.branches.find(b => b.branch === rec.branch);
              
              // If no exact match, try partial match
              if (!branchInfo) {
                branchInfo = rec.user_id.branches.find(b => 
                  b.branch.toLowerCase().includes(rec.branch.toLowerCase()) ||
                  rec.branch.toLowerCase().includes(b.branch.toLowerCase())
                );
              }
              
              // If still no match, try removing 'ifda-' prefix
              if (!branchInfo) {
                const cleanBranch = rec.branch.replace(/^ifda-/, '');
                branchInfo = rec.user_id.branches.find(b => 
                  b.branch.toLowerCase().includes(cleanBranch.toLowerCase()) ||
                  cleanBranch.toLowerCase().includes(b.branch.toLowerCase())
                );
              }
              
              if (branchInfo) {
                branchName = branchInfo.branch || branchName;
                if (branchInfo.timing) {
                  officeTiming = `${branchInfo.timing.start || ''} - ${branchInfo.timing.end || ''}`;
                }
                console.log(`✅ Branch matched: ${rec.branch} -> ${branchName}`);
              } else {
                console.log(`❌ No branch match found for: ${rec.branch}`);
              }
            }
          }
          
          return {
            ...rec.toObject(),
            user_name: rec.user_id?.name || '',
            designation,
            phone_number,
            office_timing: officeTiming,
            branch_name: branchName,
            user_code: rec.user_id?.user_code || '', // <-- Add user_code for frontend punch API
          };
        } catch (mapError) {
          console.error('Error mapping record:', mapError, 'Record:', rec);
          return {
            ...rec.toObject(),
            user_name: rec.user_id?.name || '',
            designation: '',
            phone_number: '',
            office_timing: '',
            branch_name: rec.branch || '',
          };
        }
      });

    // Apply search filter after population
    if (search) {
      data = data.filter(record => 
        record.user_name && record.user_name.toLowerCase().includes(search.toLowerCase())
      );
      console.log('After search filter:', data.length);
    }

    console.log('Final data count:', data.length);

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching DailyAttendance:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching DailyAttendance',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getUserAttendanceReport = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    
    console.log('User Attendance Report Query:', { userId, startDate, endDate });
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }
    
    // Build filter object
    const filter = { user_id: userId };
    
    // Date range filter
    if (startDate || endDate) {
      filter.attendance_date = {};
      if (startDate) {
        const startDateTime = new Date(startDate + 'T00:00:00.000+05:30');
        filter.attendance_date.$gte = startDateTime;
      }
      if (endDate) {
        const endDateTime = new Date(endDate + 'T23:59:59.999+05:30');
        filter.attendance_date.$lte = endDateTime;
      }
    }
    
    console.log('MongoDB filter:', JSON.stringify(filter, null, 2));
    
    // Get attendance records
    const records = await Attendance.find(filter)
      .sort({ attendance_date: -1 })
      .populate({
        path: 'user_id',
        select: 'name user_code branches designation phone_number status',
        match: { status: 'Active' },
      });
    
    console.log('Found records:', records.length);
    
    if (records.length === 0 || !records[0].user_id) {
      return res.status(200).json({ 
        success: true, 
        data: [],
        summary: {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          muchLate: 0,
          halfDay: 0,
          leave: 0,
          sunday: 0,
          holiday: 0
        },
        user: null
      });
    }
    
    // Get user info from first record
    const user = records[0].user_id;
    
    // Process records
    const data = records.filter(rec => rec.user_id).map((rec) => {
      let officeTiming = '';
      let branchName = rec.branch || '';
      
      if (user && user.branches && rec.branch) {
        // Try exact match first
        let branchInfo = user.branches.find(b => b.branch === rec.branch);
        
        // If no exact match, try partial match
        if (!branchInfo) {
          branchInfo = user.branches.find(b => 
            b.branch.toLowerCase().includes(rec.branch.toLowerCase()) ||
            rec.branch.toLowerCase().includes(b.branch.toLowerCase())
          );
        }
        
        // If still no match, try removing 'ifda-' prefix
        if (!branchInfo) {
          const cleanBranch = rec.branch.replace(/^ifda-/, '');
          branchInfo = user.branches.find(b => 
            b.branch.toLowerCase().includes(cleanBranch.toLowerCase()) ||
            cleanBranch.toLowerCase().includes(b.branch.toLowerCase())
          );
        }
        
        if (branchInfo) {
          branchName = branchInfo.branch || branchName;
          if (branchInfo.timing) {
            officeTiming = `${branchInfo.timing.start || ''} - ${branchInfo.timing.end || ''}`;
          }
        }
      }
      
      return {
        _id: rec._id,
        attendance_date: rec.attendance_date,
        log_in: rec.log_in,
        log_out: rec.log_out,
        status: rec.status,
        branch: rec.branch,
        branch_name: branchName,
        office_timing: officeTiming,
        created_at: rec.createdAt,
        updated_at: rec.updatedAt
      };
    });
    
    // Calculate summary
    const summary = {
      total: data.length,
      present: data.filter(r => r.status === 'Present').length,
      absent: data.filter(r => r.status === 'Absent').length,
      late: data.filter(r => r.status === 'Late').length,
      muchLate: data.filter(r => r.status === 'Much Late').length,
      halfDay: data.filter(r => r.status === 'Half Day').length,
      leave: data.filter(r => r.status === 'Leave').length,
      sunday: data.filter(r => r.status === 'Sunday').length,
      holiday: data.filter(r => r.status === 'Holiday').length
    };
    
    // User info
    const userInfo = {
      _id: user._id,
      name: user.name,
      user_code: user.user_code,
      designation: user.designation,
      phone_number: user.phone_number,
      branches: user.branches
    };
    
    console.log('Summary:', summary);
    
    res.status(200).json({ 
      success: true, 
      data,
      summary,
      user: userInfo
    });
    
  } catch (error) {
    console.error('Error fetching User Attendance Report:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching User Attendance Report',
      error: error.message
    });
  }
};

exports.getAllUsersAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate, branch } = req.query;
    const userFilter = {};
    if (branch) {
      userFilter['branches.branch'] = branch;
    }

    // Get all users (filter by branch if provided)
    const User = require('../models/User');
    let users = await User.find(userFilter).select('_id name user_code designation phone_number branches status role');
    
    // Filter users: exclude admin, role order users, and include only active users
    users = users.filter(user => {
      const isNotAdmin = user.name?.toLowerCase() !== 'admin';
      const hasNoRoleOrder = !user.role !== 'order';
      const isActive = user.status === 'Active';
      return isNotAdmin && hasNoRoleOrder && isActive;
    });

    if (!users.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Build attendance filter
    const attendanceFilter = {};
    if (startDate || endDate) {
      attendanceFilter.attendance_date = {};
      if (startDate) attendanceFilter.attendance_date.$gte = new Date(startDate + 'T00:00:00.000+05:30');
      if (endDate) attendanceFilter.attendance_date.$lte = new Date(endDate + 'T23:59:59.999+05:30');
    }

    // Get all attendance records in range
    const Attendance = require('../models/Attendance');
    const allAttendance = await Attendance.find(attendanceFilter).select('user_id status');

    // Group attendance by user
    const attendanceByUser = {};
    allAttendance.forEach(rec => {
      const uid = rec.user_id?.toString();
      if (!uid) return;
      if (!attendanceByUser[uid]) attendanceByUser[uid] = [];
      attendanceByUser[uid].push(rec.status);
    });

    // Prepare summary for each user
    const summaryData = users.map(user => {
      const uid = user._id.toString();
      const statuses = attendanceByUser[uid] || [];
      const summary = {
        total: statuses.length,
        present: statuses.filter(s => s === 'Present').length,
        absent: statuses.filter(s => s === 'Absent').length,
        late: statuses.filter(s => s === 'Late').length,
        muchLate: statuses.filter(s => s === 'Much Late').length,
        halfDay: statuses.filter(s => s === 'Half Day').length,
        leave: statuses.filter(s => s === 'Leave').length,
        sunday: statuses.filter(s => s === 'Sunday').length,
        holiday: statuses.filter(s => s === 'Holiday').length,
      };
      return {
        _id: user._id,
        name: user.name,
        user_code: user.user_code,
        designation: user.designation,
        phone_number: user.phone_number,
        branches: user.branches,
        status: user.status,
        role: user.role,
        ...summary
      };
    });

    console.log(`✅ Filtered ${users.length} active users out of total users`);
    res.status(200).json({ success: true, data: summaryData });
  } catch (error) {
    console.error('Error in getAllUsersAttendanceSummary:', error);
    res.status(500).json({ success: false, message: 'Error fetching all users attendance summary', error: error.message });
  }
};
