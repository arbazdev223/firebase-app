const Checklist = require('../models/Checklist'); // Import the Checklist model
const ChecklistSubmission = require('../models/ChecklistSubmission'); // Import the ChecklistSubmission model

// Controller to get all checklists
exports.getAllChecklists = async (req, res) => {
  try {
    // Fetch all checklists from the database
    const checklists = await Checklist.find();

    // If no checklists found, return a 404 response
    if (!checklists || checklists.length === 0) {
      return res.status(404).json({ message: 'No checklists found' });
    }

    // Send the list of checklists as a response
    res.status(200).json(checklists);
  } catch (err) {
    // Handle errors and send a server error response
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getServerCheck = async (req, res) => {
  res.status(200).json({ message: 'Server run' });
};

// Controller to handle checklist submissions
exports.submitChecklist = async (req, res) => {
  try {
    const { user, tasks } = req.body;
    
    // Validate required fields
    if (!user || !tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid submission data. User and tasks array are required.' 
      });
    }

    // Validate user object
    if (!user._id || !user.name || !user.department) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user data. User ID, name and department are required.' 
      });
    }

    // Validate tasks array
    if (tasks.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'At least one task is required for submission.' 
      });
    }

    // Validate each task
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (!task.frequency || !task.option) {
        return res.status(400).json({ 
          success: false,
          message: `Task ${i + 1} is missing required fields (frequency or option).` 
        });
      }
    }

    // Check if submission already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingSubmission = await ChecklistSubmission.findOne({
      'user._id': user._id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingSubmission) {
      return res.status(409).json({ 
        success: false,
        message: 'A checklist submission already exists for today. You can only submit once per day.' 
      });
    }

    // Create new submission
    const submission = new ChecklistSubmission({ 
      user, 
      tasks,
      date: new Date()
    });

    await submission.save();

    // Calculate total time spent
    const totalTimeSpent = tasks.reduce((sum, task) => {
      return sum + (typeof task.gap === 'number' ? task.gap : 0);
    }, 0);

    res.status(201).json({ 
      success: true,
      message: 'Checklist submitted successfully',
      data: {
        submissionId: submission._id,
        totalTasks: tasks.length,
        totalTimeSpent: totalTimeSpent,
        submittedAt: submission.date
      }
    });

  } catch (err) {
    console.error('Checklist submission error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error occurred while submitting checklist' 
    });
  }
};

// Get checklist submissions report
exports.getChecklistReport = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      userId, 
      department, 
      frequency,
      branch, // Add branch parameter
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // User filter
    if (userId) {
      filter['user._id'] = userId;
    }

    // Department filter
    if (department) {
      filter['user.department'] = { $in: [department] };
    }

    // Branch filter
    if (branch) {
      filter['user.branch'] = { $regex: new RegExp(branch, 'i') };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get submissions with pagination
    const submissions = await ChecklistSubmission.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await ChecklistSubmission.countDocuments(filter);

    // Calculate summary statistics
    const summary = await ChecklistSubmission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          totalTasks: { $sum: { $size: '$tasks' } },
          totalTimeSpent: {
            $sum: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          },
          averageTimePerSubmission: {
            $avg: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    // Get department-wise statistics
    const departmentStats = await ChecklistSubmission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$user.department',
          count: { $sum: 1 },
          totalTime: {
            $sum: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get frequency-wise statistics
    const frequencyStats = await ChecklistSubmission.aggregate([
      { $match: filter },
      { $unwind: '$tasks' },
      {
        $group: {
          _id: '$tasks.frequency',
          count: { $sum: 1 },
          totalTime: {
            $sum: { $cond: [{ $isNumber: '$tasks.gap' }, '$tasks.gap', 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + submissions.length < totalCount,
          hasPrevPage: parseInt(page) > 1
        },
        summary: summary[0] || {
          totalSubmissions: 0,
          totalTasks: 0,
          totalTimeSpent: 0,
          averageTimePerSubmission: 0
        },
        departmentStats,
        frequencyStats
      }
    });

  } catch (err) {
    console.error('Checklist report error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while generating report'
    });
  }
};

// Get user's own submissions
exports.getUserSubmissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const filter = { 'user._id': userId };

    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const submissions = await ChecklistSubmission.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await ChecklistSubmission.countDocuments(filter);

    // Calculate user statistics
    const userStats = await ChecklistSubmission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          totalTasks: { $sum: { $size: '$tasks' } },
          totalTimeSpent: {
            $sum: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          },
          averageTimePerSubmission: {
            $avg: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
          hasNextPage: skip + submissions.length < totalCount,
          hasPrevPage: parseInt(page) > 1
        },
        userStats: userStats[0] || {
          totalSubmissions: 0,
          totalTasks: 0,
          totalTimeSpent: 0,
          averageTimePerSubmission: 0
        }
      }
    });

  } catch (err) {
    console.error('User submissions error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching user submissions'
    });
  }
};

// Get daily submission statistics
exports.getDailyStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const dailyStats = await ChecklistSubmission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          submissions: { $sum: 1 },
          totalTasks: { $sum: { $size: '$tasks' } },
          totalTimeSpent: {
            $sum: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          },
          users: { $addToSet: '$user._id' }
        }
      },
      {
        $project: {
          date: '$_id',
          submissions: 1,
          totalTasks: 1,
          totalTimeSpent: 1,
          uniqueUsers: { $size: '$users' }
        }
      },
      { $sort: { date: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: dailyStats
    });

  } catch (err) {
    console.error('Daily stats error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching daily statistics'
    });
  }
};

// Export checklist report to Excel format
exports.exportChecklistReport = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      userId, 
      department, 
      frequency,
      format = 'json' // json, csv, excel
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // User filter
    if (userId) {
      filter['user._id'] = userId;
    }

    // Department filter
    if (department) {
      filter['user.department'] = { $in: [department] };
    }

    // Get all submissions for export
    const submissions = await ChecklistSubmission.find(filter)
      .sort({ date: -1 });

    if (format === 'csv') {
      // Generate CSV format
      let csvContent = 'Date,User Name,Department,Total Tasks,Total Time (minutes),Tasks Details\n';
      
      submissions.forEach(submission => {
        const tasksDetails = submission.tasks.map(task => 
          `${task.frequency}: ${task.option} (${task.gap || 0} min)`
        ).join('; ');
        
        csvContent += `${submission.date.toISOString().split('T')[0]},${submission.user.name},${submission.user.department.join(',')},${submission.tasks.length},${submission.tasks.reduce((sum, task) => sum + (typeof task.gap === 'number' ? task.gap : 0), 0)},"${tasksDetails}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=checklist-report.csv');
      res.send(csvContent);
    } else {
      // Return JSON format
      const exportData = submissions.map(submission => ({
        date: submission.date,
        user: {
          name: submission.user.name,
          department: submission.user.department,
          id: submission.user._id
        },
        totalTasks: submission.tasks.length,
        totalTimeSpent: submission.tasks.reduce((sum, task) => 
          sum + (typeof task.gap === 'number' ? task.gap : 0), 0
        ),
        tasks: submission.tasks.map(task => ({
          frequency: task.frequency,
          option: task.option,
          startTime: task.startTime,
          endTime: task.endTime,
          gap: task.gap,
          presentCount: task.presentCount,
          absentCount: task.absentCount,
          additionalWork: task.additionalWork
        }))
      }));

      res.status(200).json({
        success: true,
        data: exportData,
        totalRecords: exportData.length,
        exportDate: new Date().toISOString()
      });
    }

  } catch (err) {
    console.error('Export report error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while exporting report'
    });
  }
};

// Get checklist analytics dashboard data
exports.getChecklistAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get overall statistics
    const overallStats = await ChecklistSubmission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          totalTasks: { $sum: { $size: '$tasks' } },
          totalTimeSpent: {
            $sum: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          },
          uniqueUsers: { $addToSet: '$user._id' }
        }
      }
    ]);

    // Get top performing users
    const topUsers = await ChecklistSubmission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$user._id',
          userName: { $first: '$user.name' },
          userDepartment: { $first: '$user.department' },
          submissions: { $sum: 1 },
          totalTasks: { $sum: { $size: '$tasks' } },
          totalTimeSpent: {
            $sum: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          }
        }
      },
      { $sort: { totalTimeSpent: -1 } },
      { $limit: 10 }
    ]);

    // Get task frequency distribution
    const taskFrequencyStats = await ChecklistSubmission.aggregate([
      { $match: filter },
      { $unwind: '$tasks' },
      {
        $group: {
          _id: '$tasks.frequency',
          count: { $sum: 1 },
          totalTime: {
            $sum: { $cond: [{ $isNumber: '$tasks.gap' }, '$tasks.gap', 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get weekly trend
    const weeklyTrend = await ChecklistSubmission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            week: { $week: '$date' }
          },
          submissions: { $sum: 1 },
          totalTasks: { $sum: { $size: '$tasks' } },
          totalTimeSpent: {
            $sum: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.week': -1 } },
      { $limit: 12 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overallStats: overallStats[0] || {
          totalSubmissions: 0,
          totalTasks: 0,
          totalTimeSpent: 0,
          uniqueUsers: []
        },
        topUsers,
        taskFrequencyStats,
        weeklyTrend
      }
    });

  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while generating analytics'
    });
  }
};

// Analyze checklist data and generate comprehensive report
exports.analyzeChecklistData = async (req, res) => {
  try {
    // Fetch checklist data from the API
    const response = await fetch('https://test.ifda.in/api/checklists');
    const checklistData = await response.json();

    if (!checklistData || !Array.isArray(checklistData)) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch checklist data'
      });
    }

    // Analyze the data
    const analysis = {
      totalTasks: checklistData.length,
      
      // Department Analysis
      departments: {},
      departmentStats: [],
      
      // Frequency Analysis
      frequencies: {},
      frequencyStats: [],
      
      // Main Base Analysis
      mainBases: {},
      mainBaseStats: [],
      
      // Weightage Analysis
      weightageDistribution: {
        low: 0,      // 0-3
        medium: 0,   // 4-7
        high: 0      // 8+
      },
      
      // Adhoc Task Analysis
      adhocTasks: {
        total: 0,
        adhoc: 0,
        na: 0
      },
      
      // Top Tasks by Weightage
      topTasksByWeightage: [],
      
      // Department-wise Task Distribution
      departmentTaskDistribution: {},
      
      // Frequency-wise Task Distribution
      frequencyTaskDistribution: {},
      
      // Main Base-wise Task Distribution
      mainBaseTaskDistribution: {},
      
      // Summary Statistics
      summary: {
        totalTasks: checklistData.length,
        uniqueDepartments: 0,
        uniqueFrequencies: 0,
        uniqueMainBases: 0,
        averageWeightage: 0,
        totalWeightage: 0
      }
    };

    // Process each task
    checklistData.forEach(task => {
      // Department analysis
      if (task.department && Array.isArray(task.department)) {
        task.department.forEach(dept => {
          analysis.departments[dept] = (analysis.departments[dept] || 0) + 1;
        });
      }

      // Frequency analysis
      if (task.frequency) {
        analysis.frequencies[task.frequency] = (analysis.frequencies[task.frequency] || 0) + 1;
      }

      // Main base analysis
      if (task.main_base) {
        analysis.mainBases[task.main_base] = (analysis.mainBases[task.main_base] || 0) + 1;
      }

      // Weightage analysis
      const weightage = task.weightage || 0;
      analysis.summary.totalWeightage += weightage;
      
      if (weightage <= 3) {
        analysis.weightageDistribution.low++;
      } else if (weightage <= 7) {
        analysis.weightageDistribution.medium++;
      } else {
        analysis.weightageDistribution.high++;
      }

      // Adhoc task analysis
      analysis.adhocTasks.total++;
      if (task.adhoc_task === 'ADHOC') {
        analysis.adhocTasks.adhoc++;
      } else if (task.adhoc_task === 'NA') {
        analysis.adhocTasks.na++;
      }
    });

    // Calculate averages
    analysis.summary.averageWeightage = analysis.summary.totalWeightage / analysis.summary.totalTasks;
    analysis.summary.uniqueDepartments = Object.keys(analysis.departments).length;
    analysis.summary.uniqueFrequencies = Object.keys(analysis.frequencies).length;
    analysis.summary.uniqueMainBases = Object.keys(analysis.mainBases).length;

    // Create department stats
    analysis.departmentStats = Object.entries(analysis.departments)
      .map(([dept, count]) => ({
        department: dept,
        taskCount: count,
        percentage: ((count / analysis.summary.totalTasks) * 100).toFixed(2)
      }))
      .sort((a, b) => b.taskCount - a.taskCount);

    // Create frequency stats
    analysis.frequencyStats = Object.entries(analysis.frequencies)
      .map(([freq, count]) => ({
        frequency: freq,
        taskCount: count,
        percentage: ((count / analysis.summary.totalTasks) * 100).toFixed(2)
      }))
      .sort((a, b) => b.taskCount - a.taskCount);

    // Create main base stats
    analysis.mainBaseStats = Object.entries(analysis.mainBases)
      .map(([base, count]) => ({
        mainBase: base,
        taskCount: count,
        percentage: ((count / analysis.summary.totalTasks) * 100).toFixed(2)
      }))
      .sort((a, b) => b.taskCount - a.taskCount);

    // Top tasks by weightage
    analysis.topTasksByWeightage = checklistData
      .filter(task => task.weightage > 0)
      .sort((a, b) => (b.weightage || 0) - (a.weightage || 0))
      .slice(0, 10)
      .map(task => ({
        task_name: task.task_name,
        department: task.department,
        frequency: task.frequency,
        main_base: task.main_base,
        weightage: task.weightage,
        adhoc_task: task.adhoc_task
      }));

    // Department-wise task distribution
    analysis.departmentTaskDistribution = {};
    checklistData.forEach(task => {
      if (task.department && Array.isArray(task.department)) {
        task.department.forEach(dept => {
          if (!analysis.departmentTaskDistribution[dept]) {
            analysis.departmentTaskDistribution[dept] = {
              totalTasks: 0,
              frequencies: {},
              mainBases: {},
              totalWeightage: 0
            };
          }
          analysis.departmentTaskDistribution[dept].totalTasks++;
          analysis.departmentTaskDistribution[dept].totalWeightage += (task.weightage || 0);
          
          // Frequency distribution
          if (task.frequency) {
            analysis.departmentTaskDistribution[dept].frequencies[task.frequency] = 
              (analysis.departmentTaskDistribution[dept].frequencies[task.frequency] || 0) + 1;
          }
          
          // Main base distribution
          if (task.main_base) {
            analysis.departmentTaskDistribution[dept].mainBases[task.main_base] = 
              (analysis.departmentTaskDistribution[dept].mainBases[task.main_base] || 0) + 1;
          }
        });
      }
    });

    // Frequency-wise task distribution
    analysis.frequencyTaskDistribution = {};
    checklistData.forEach(task => {
      if (task.frequency) {
        if (!analysis.frequencyTaskDistribution[task.frequency]) {
          analysis.frequencyTaskDistribution[task.frequency] = {
            totalTasks: 0,
            departments: {},
            mainBases: {},
            totalWeightage: 0
          };
        }
        analysis.frequencyTaskDistribution[task.frequency].totalTasks++;
        analysis.frequencyTaskDistribution[task.frequency].totalWeightage += (task.weightage || 0);
        
        // Department distribution
        if (task.department && Array.isArray(task.department)) {
          task.department.forEach(dept => {
            analysis.frequencyTaskDistribution[task.frequency].departments[dept] = 
              (analysis.frequencyTaskDistribution[task.frequency].departments[dept] || 0) + 1;
          });
        }
        
        // Main base distribution
        if (task.main_base) {
          analysis.frequencyTaskDistribution[task.frequency].mainBases[task.main_base] = 
            (analysis.frequencyTaskDistribution[task.frequency].mainBases[task.main_base] || 0) + 1;
        }
      }
    });

    // Main base-wise task distribution
    analysis.mainBaseTaskDistribution = {};
    checklistData.forEach(task => {
      if (task.main_base) {
        if (!analysis.mainBaseTaskDistribution[task.main_base]) {
          analysis.mainBaseTaskDistribution[task.main_base] = {
            totalTasks: 0,
            departments: {},
            frequencies: {},
            totalWeightage: 0
          };
        }
        analysis.mainBaseTaskDistribution[task.main_base].totalTasks++;
        analysis.mainBaseTaskDistribution[task.main_base].totalWeightage += (task.weightage || 0);
        
        // Department distribution
        if (task.department && Array.isArray(task.department)) {
          task.department.forEach(dept => {
            analysis.mainBaseTaskDistribution[task.main_base].departments[dept] = 
              (analysis.mainBaseTaskDistribution[task.main_base].departments[dept] || 0) + 1;
          });
        }
        
        // Frequency distribution
        if (task.frequency) {
          analysis.mainBaseTaskDistribution[task.main_base].frequencies[task.frequency] = 
            (analysis.mainBaseTaskDistribution[task.main_base].frequencies[task.frequency] || 0) + 1;
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Checklist data analysis completed successfully',
      data: analysis,
      rawData: checklistData
    });

  } catch (err) {
    console.error('Checklist analysis error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while analyzing checklist data'
    });
  }
};

// Get Individual Employee Checklist Report with Admin Insights
exports.getEmployeeChecklistReport = async (req, res) => {
  try {
    const { 
      employeeId, 
      startDate, 
      endDate, 
      department,
      includeDetails = 'true',
      format = 'json'
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Employee filter
    if (employeeId) {
      filter['user._id'] = employeeId;
    }

    // Department filter
    if (department) {
      filter['user.department'] = { $in: [department] };
    }

    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get employee submissions
    const submissions = await ChecklistSubmission.find(filter)
      .sort({ date: -1 });

    // Get employee details
    const employeeDetails = submissions.length > 0 ? submissions[0].user : null;

    // Calculate employee statistics
    const employeeStats = await ChecklistSubmission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          totalTasks: { $sum: { $size: '$tasks' } },
          totalTimeSpent: {
            $sum: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          },
          averageTimePerSubmission: {
            $avg: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          },
          averageTasksPerSubmission: {
            $avg: { $size: '$tasks' }
          },
          submissionDates: { $addToSet: '$date' }
        }
      }
    ]);

    // Get task frequency distribution
    const taskFrequencyStats = await ChecklistSubmission.aggregate([
      { $match: filter },
      { $unwind: '$tasks' },
      {
        $group: {
          _id: '$tasks.frequency',
          count: { $sum: 1 },
          totalTime: {
            $sum: { $cond: [{ $isNumber: '$tasks.gap' }, '$tasks.gap', 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get daily submission trend
    const dailyTrend = await ChecklistSubmission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          submissions: { $sum: 1 },
          totalTasks: { $sum: { $size: '$tasks' } },
          totalTimeSpent: {
            $sum: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Get task type analysis
    const taskTypeAnalysis = await ChecklistSubmission.aggregate([
      { $match: filter },
      { $unwind: '$tasks' },
      {
        $group: {
          _id: '$tasks.option',
          count: { $sum: 1 },
          totalTime: {
            $sum: { $cond: [{ $isNumber: '$tasks.gap' }, '$tasks.gap', 0] }
          },
          averageTime: {
            $avg: { $cond: [{ $isNumber: '$tasks.gap' }, '$tasks.gap', 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Calculate completion rate
    const totalDays = employeeStats[0]?.submissionDates?.length || 0;
    const dateRange = startDate && endDate ? 
      Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) : 30;
    const completionRate = totalDays > 0 ? ((totalDays / dateRange) * 100).toFixed(2) : 0;

    // Prepare response data
    const reportData = {
      employee: employeeDetails,
      summary: {
        totalSubmissions: employeeStats[0]?.totalSubmissions || 0,
        totalTasks: employeeStats[0]?.totalTasks || 0,
        totalTimeSpent: employeeStats[0]?.totalTimeSpent || 0,
        averageTimePerSubmission: employeeStats[0]?.averageTimePerSubmission || 0,
        averageTasksPerSubmission: employeeStats[0]?.averageTasksPerSubmission || 0,
        completionRate: parseFloat(completionRate),
        totalDays: totalDays,
        dateRange: dateRange
      },
      taskFrequencyStats,
      dailyTrend,
      taskTypeAnalysis,
      submissions: includeDetails === 'true' ? submissions : []
    };

    // Format response based on format parameter
    if (format === 'csv') {
      // Generate CSV format
      let csvContent = 'Date,Employee Name,Department,Total Tasks,Total Time (minutes),Tasks Details\n';
      
      submissions.forEach(submission => {
        const tasksDetails = submission.tasks.map(task => 
          `${task.frequency}: ${task.option} (${task.gap || 0} min)`
        ).join('; ');
        
        csvContent += `${submission.date.toISOString().split('T')[0]},${submission.user.name},${submission.user.department.join(',')},${submission.tasks.length},${submission.tasks.reduce((sum, task) => sum + (typeof task.gap === 'number' ? task.gap : 0), 0)},"${tasksDetails}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=employee-checklist-report-${employeeId || 'all'}.csv`);
      res.send(csvContent);
    } else {
      res.status(200).json({
        success: true,
        message: 'Employee checklist report generated successfully',
        data: reportData
      });
    }

  } catch (err) {
    console.error('Employee checklist report error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while generating employee report'
    });
  }
};

// Get Admin Dashboard - All Employees Summary
exports.getAdminEmployeeSummary = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      department,
      sortBy = 'totalSubmissions',
      sortOrder = 'desc',
      limit = 20
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Department filter
    if (department) {
      filter['user.department'] = { $in: [department] };
    }

    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get all employees summary
    const employeesSummary = await ChecklistSubmission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$user._id',
          employeeName: { $first: '$user.name' },
          employeeDepartment: { $first: '$user.department' },
          totalSubmissions: { $sum: 1 },
          totalTasks: { $sum: { $size: '$tasks' } },
          totalTimeSpent: {
            $sum: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          },
          averageTimePerSubmission: {
            $avg: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          },
          averageTasksPerSubmission: {
            $avg: { $size: '$tasks' }
          },
          lastSubmissionDate: { $max: '$date' },
          firstSubmissionDate: { $min: '$date' }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $and: [startDate, endDate] },
              {
                $multiply: [
                  {
                    $divide: [
                      '$totalSubmissions',
                      {
                        $ceil: {
                          $divide: [
                            { $subtract: [new Date(endDate), new Date(startDate)] },
                            { $multiply: [1000, 60, 60, 24] }
                          ]
                        }
                      }
                    ]
                  },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
      { $limit: parseInt(limit) }
    ]);

    // Get department-wise summary
    const departmentSummary = await ChecklistSubmission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$user.department',
          totalEmployees: { $addToSet: '$user._id' },
          totalSubmissions: { $sum: 1 },
          totalTasks: { $sum: { $size: '$tasks' } },
          totalTimeSpent: {
            $sum: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          uniqueEmployees: { $size: '$totalEmployees' },
          averageSubmissionsPerEmployee: {
            $divide: ['$totalSubmissions', { $size: '$totalEmployees' }]
          }
        }
      },
      { $sort: { totalSubmissions: -1 } }
    ]);

    // Get overall statistics
    const overallStats = await ChecklistSubmission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalEmployees: { $addToSet: '$user._id' },
          totalSubmissions: { $sum: 1 },
          totalTasks: { $sum: { $size: '$tasks' } },
          totalTimeSpent: {
            $sum: {
              $reduce: {
                input: '$tasks',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $cond: [{ $isNumber: '$$this.gap' }, '$$this.gap', 0] }
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Admin employee summary generated successfully',
      data: {
        employeesSummary,
        departmentSummary,
        overallStats: overallStats[0] ? {
          ...overallStats[0],
          uniqueEmployees: overallStats[0].totalEmployees.length
        } : {
          totalEmployees: 0,
          totalSubmissions: 0,
          totalTasks: 0,
          totalTimeSpent: 0,
          uniqueEmployees: 0
        }
      }
    });

  } catch (err) {
    console.error('Admin employee summary error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while generating admin summary'
    });
  }
};

// Comprehensive Performance Report of Employee
exports.getEmployeePerformanceReport = async (req, res) => {
  try {
    const { 
      employeeId, 
      startDate, 
      endDate, 
      includeDetails = false 
    } = req.query;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.attendance_date = {};
      if (startDate) {
        const startDateTime = new Date(startDate + 'T00:00:00.000+05:30');
        dateFilter.attendance_date.$gte = startDateTime;
      }
      if (endDate) {
        const endDateTime = new Date(endDate + 'T23:59:59.999+05:30');
        dateFilter.attendance_date.$lte = endDateTime;
      }
    }

    // 1. Get Attendance Data
    const Attendance = require('../models/Attendance');
    const attendanceRecords = await Attendance.find({
      user_id: employeeId,
      ...dateFilter
    }).populate('user_id', 'name user_code designation phone_number branches');

    // 2. Get Checklist Data
    const checklistSubmissions = await ChecklistSubmission.find({
      'user._id': employeeId,
      ...(startDate || endDate ? {
        date: {
          ...(startDate && { $gte: new Date(startDate + 'T00:00:00.000+05:30') }),
          ...(endDate && { $lte: new Date(endDate + 'T23:59:59.999+05:30') })
        }
      } : {})
    });

    // 3. Get Task Data
    const Task = require('../models/task');
    const taskRecords = await Task.find({
      assignedUser: employeeId,
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { $gte: new Date(startDate + 'T00:00:00.000+05:30') }),
          ...(endDate && { $lte: new Date(endDate + 'T23:59:59.999+05:30') })
        }
      } : {})
    });

    // 4. Get Tally Attendance Data from External API
    let tallyAttendanceData = [];
    try {
      const tallyStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const tallyEndDate = endDate || new Date().toISOString().split('T')[0];
      
      const tallyResponse = await fetch(`https://lms.ifda.in/api/v1/fetch?start${tallyStartDate}&end${tallyEndDate}`);
      if (tallyResponse.ok) {
        const tallyData = await tallyResponse.json();
        // Filter data for the specific employee if possible
        tallyAttendanceData = Array.isArray(tallyData) ? tallyData : [];
      }
    } catch (error) {
      console.error('Error fetching tally attendance:', error);
    }

    // 5. Get Remarks Data
    const AllRemark = require('../models/AllEnqureRemark');
    const remarksData = await AllRemark.find({
      user: employeeId,
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { $gte: new Date(startDate + 'T00:00:00.000+05:30') }),
          ...(endDate && { $lte: new Date(endDate + 'T23:59:59.999+05:30') })
        }
      } : {})
    }).populate('user', 'name email');

    // Calculate Attendance Statistics
    const presentRecords = attendanceRecords.filter(r => ['Present', 'Late', 'Much Late', 'Half Day'].includes(r.status)).length;
    const attendanceRate = attendanceRecords.length > 0 ? (presentRecords / attendanceRecords.length * 100) : 0;
    
    const attendanceStats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter(r => r.status === 'Present').length,
      absent: attendanceRecords.filter(r => r.status === 'Absent').length,
      late: attendanceRecords.filter(r => r.status === 'Late').length,
      muchLate: attendanceRecords.filter(r => r.status === 'Much Late').length,
      halfDay: attendanceRecords.filter(r => r.status === 'Half Day').length,
      leave: attendanceRecords.filter(r => r.status === 'Leave').length,
      sunday: attendanceRecords.filter(r => r.status === 'Sunday').length,
      holiday: attendanceRecords.filter(r => r.status === 'Holiday').length,
      attendanceRate: attendanceRate
    };

    // Calculate Checklist Statistics
    const checklistStats = {
      totalSubmissions: checklistSubmissions.length,
      totalTasks: checklistSubmissions.reduce((sum, sub) => sum + sub.tasks.length, 0),
      totalTimeSpent: checklistSubmissions.reduce((sum, sub) => {
        return sum + sub.tasks.reduce((taskSum, task) => {
          return taskSum + (typeof task.gap === 'number' ? task.gap : 0);
        }, 0);
      }, 0),
      averageTimePerTask: checklistSubmissions.length > 0 ? 
        (checklistSubmissions.reduce((sum, sub) => {
          return sum + sub.tasks.reduce((taskSum, task) => {
            return taskSum + (typeof task.gap === 'number' ? task.gap : 0);
          }, 0);
        }, 0) / checklistSubmissions.reduce((sum, sub) => sum + sub.tasks.length, 0)).toFixed(2) : 0
    };

    // Calculate Task Statistics
    const taskStats = {
      totalTasks: taskRecords.length,
      completedTasks: taskRecords.filter(t => t.status === 'Completed').length,
      pendingTasks: taskRecords.filter(t => t.status === 'Pending').length,
      inProgressTasks: taskRecords.filter(t => t.status === 'In Progress').length,
      completionRate: taskRecords.length > 0 ? 
        (taskRecords.filter(t => t.status === 'Completed').length / taskRecords.length * 100).toFixed(2) : 0
    };

    // Calculate Tally Attendance Statistics
    const tallyStats = {
      totalRecords: tallyAttendanceData.length,
      // Add more specific tally statistics based on the actual data structure
    };

    // Calculate Remarks Statistics
    const remarksStats = {
      totalRemarks: remarksData.length,
      averageRemarksPerDay: remarksData.length > 0 ? 
        (remarksData.length / Math.max(1, Math.ceil((new Date(endDate || Date.now()) - new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000)) / (1000 * 60 * 60 * 24)))).toFixed(2) : 0
    };

    // Calculate Overall Performance Score
    const attendanceScore = parseFloat(attendanceStats.attendanceRate) * 0.3; // 30% weight
    
    // Calculate checklist score with simplified logic
    let checklistScore = 0;
    if (checklistStats.totalSubmissions > 0) {
      const daysDiff = Math.ceil((new Date(endDate || Date.now()) - new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000)) / (1000 * 60 * 60 * 24));
      const maxDays = Math.max(1, daysDiff);
      const submissionRate = (checklistStats.totalSubmissions / maxDays) * 100;
      checklistScore = Math.min(100, submissionRate) * 0.25;
    }
    
    const taskScore = parseFloat(taskStats.completionRate) * 0.25; // 25% weight
    const remarksScore = remarksStats.totalRemarks > 0 ? 
      Math.min(100, remarksStats.totalRemarks * 10) * 0.2 : 0; // 20% weight

    const overallScore = attendanceScore + checklistScore + taskScore + remarksScore;

    // Prepare response data
    const responseData = {
      success: true,
      employee: attendanceRecords[0]?.user_id || null,
      period: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0]
      },
      performance: {
        overallScore: overallScore.toFixed(2),
        attendanceScore: attendanceScore.toFixed(2),
        checklistScore: checklistScore.toFixed(2),
        taskScore: taskScore.toFixed(2),
        remarksScore: remarksScore.toFixed(2)
      },
      statistics: {
        attendance: attendanceStats,
        checklist: checklistStats,
        task: taskStats,
        tally: tallyStats,
        remarks: remarksStats
      },
      summary: {
        totalWorkingDays: attendanceRecords.length,
        totalChecklistSubmissions: checklistStats.totalSubmissions,
        totalTasksAssigned: taskStats.totalTasks,
        totalRemarksAdded: remarksStats.totalRemarks,
        averageDailyTasks: taskRecords.length > 0 ? 
          (taskRecords.length / Math.max(1, Math.ceil((new Date(endDate || Date.now()) - new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000)) / (1000 * 60 * 60 * 24)))).toFixed(2) : 0
      }
    };

    // Include detailed data if requested
    if (includeDetails === 'true') {
      responseData.details = {
        attendance: attendanceRecords,
        checklist: checklistSubmissions,
        tasks: taskRecords,
        tally: tallyAttendanceData,
        remarks: remarksData
      };
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating performance report',
      error: error.message
    });
  }
};

// Get All Employees Performance Summary
exports.getAllEmployeesPerformanceSummary = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    // Get all active users
    const User = require('../models/User');
    let users = await User.find({
      status: 'Active',
      ...(department && { 'department': { $regex: department, $options: 'i' } })
    }).select('_id name user_code designation phone_number branches department');

    // Filter out admin users
    users = users.filter(user => user.name?.toLowerCase() !== 'admin');

    const performanceData = [];

    for (const user of users) {
      try {
        // Get basic attendance data for this user
        const Attendance = require('../models/Attendance');
        const attendanceRecords = await Attendance.find({
          user_id: user._id,
          ...(startDate || endDate ? {
            attendance_date: {
              ...(startDate && { $gte: new Date(startDate + 'T00:00:00.000+05:30') }),
              ...(endDate && { $lte: new Date(endDate + 'T23:59:59.999+05:30') })
            }
          } : {})
        });

        // Get checklist submissions
        const checklistSubmissions = await ChecklistSubmission.find({
          'user._id': user._id,
          ...(startDate || endDate ? {
            date: {
              ...(startDate && { $gte: new Date(startDate + 'T00:00:00.000+05:30') }),
              ...(endDate && { $lte: new Date(endDate + 'T23:59:59.999+05:30') })
            }
          } : {})
        });

        // Get task data
        const Task = require('../models/task');
        const taskRecords = await Task.find({
          assignedUser: user._id,
          ...(startDate || endDate ? {
            createdAt: {
              ...(startDate && { $gte: new Date(startDate + 'T00:00:00.000+05:30') }),
              ...(endDate && { $lte: new Date(endDate + 'T23:59:59.999+05:30') })
            }
          } : {})
        });

        // Get remarks data
        const AllRemark = require('../models/AllEnqureRemark');
        const remarksData = await AllRemark.find({
          user: user._id,
          ...(startDate || endDate ? {
            createdAt: {
              ...(startDate && { $gte: new Date(startDate + 'T00:00:00.000+05:30') }),
              ...(endDate && { $lte: new Date(endDate + 'T23:59:59.999+05:30') })
            }
          } : {})
        });

        // Calculate scores
        const attendanceRate = attendanceRecords.length > 0 ? 
          ((attendanceRecords.filter(r => ['Present', 'Late', 'Much Late', 'Half Day'].includes(r.status)).length / attendanceRecords.length * 100)) : 0;
        
        const checklistScore = checklistSubmissions.length > 0 ? 
          Math.min(100, checklistSubmissions.length * 10) : 0;
        
        const taskCompletionRate = taskRecords.length > 0 ? 
          (taskRecords.filter(t => t.status === 'Completed').length / taskRecords.length * 100) : 0;
        
        const remarksScore = remarksData.length > 0 ? 
          Math.min(100, remarksData.length * 10) : 0;

        const overallScore = (attendanceRate * 0.3) + (checklistScore * 0.25) + (taskCompletionRate * 0.25) + (remarksScore * 0.2);

        performanceData.push({
          employee: {
            _id: user._id,
            name: user.name,
            user_code: user.user_code,
            designation: user.designation,
            department: user.department,
            phone_number: user.phone_number
          },
          performance: {
            overallScore: overallScore.toFixed(2),
            attendanceRate: attendanceRate.toFixed(2),
            checklistScore: checklistScore.toFixed(2),
            taskCompletionRate: taskCompletionRate.toFixed(2),
            remarksScore: remarksScore.toFixed(2)
          },
          summary: {
            totalWorkingDays: attendanceRecords.length,
            totalChecklistSubmissions: checklistSubmissions.length,
            totalTasksAssigned: taskRecords.length,
            totalRemarksAdded: remarksData.length
          }
        });

      } catch (error) {
        console.error(`Error processing user ${user.name}:`, error);
        // Continue with other users even if one fails
      }
    }

    // Sort by overall score (descending)
    performanceData.sort((a, b) => parseFloat(b.performance.overallScore) - parseFloat(a.performance.overallScore));

    // Calculate overall statistics
    const totalEmployees = performanceData.length;
    const averageScore = totalEmployees > 0 ? 
      (performanceData.reduce((sum, emp) => sum + parseFloat(emp.performance.overallScore), 0) / totalEmployees).toFixed(2) : 0;

    const responseData = {
      success: true,
      period: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0]
      },
      summary: {
        totalEmployees,
        averageScore,
        topPerformers: performanceData.slice(0, 5),
        departmentFilter: department || 'All'
      },
      employees: performanceData
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error generating all employees performance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating performance summary',
      error: error.message
    });
  }
};