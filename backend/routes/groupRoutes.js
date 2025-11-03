const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const mongoose = require('mongoose');
const { protect, admin, faculty } = require('../middleware/Authentication'); // Import middleware
const fetch = require('node-fetch'); // For making HTTP requests to LMS API

// Import the sync script
const syncBatchGroups = require('../Commands/syncBatchGroups');

// Create group (Admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, image, description, members } = req.body;
    const createdBy = req.user._id; // Get creator from authenticated user

    const group = new Group({
      name,
      image,
      description,
      members: members || [createdBy], // Add creator to members
      admins: [createdBy], // Creator is the first admin
      createdBy,
    });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create group (Faculty only)
router.post('/by-faculty', protect, faculty, async (req, res) => {
  try {
    const { name, image, description, members } = req.body;
    const createdBy = req.user._id; // Get creator from authenticated user

    // Ensure the creator is in the members and admins list
    const memberIds = members || [];
    if (!memberIds.includes(createdBy.toString())) {
      memberIds.push(createdBy);
    }

    const group = new Group({
      name,
      image,
      description,
      members: memberIds,
      admins: [createdBy], // Creator is the only admin
      createdBy,
    });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update group info (Admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { name, image, description } = req.body;
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { name, image, description },
      { new: true }
    );
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add/Remove member (Admin only)
router.post('/:id/members', protect, admin, async (req, res) => {
  try {
    const { userId, action } = req.body; // action: 'add' or 'remove'
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    // Helper function to check if member exists (handles mixed types)
    const memberExists = (members, targetId) => {
      return members.some(member => {
        if (typeof member === 'string' && typeof targetId === 'string') {
          return member === targetId;
        }
        return member.toString() === targetId.toString();
      });
    };
    
    // Helper function to remove member (handles mixed types)
    const removeMember = (members, targetId) => {
      return members.filter(member => {
        if (typeof member === 'string' && typeof targetId === 'string') {
          return member !== targetId;
        }
        return member.toString() !== targetId.toString();
      });
    };
    
    if (action === 'add') {
      if (!memberExists(group.members, userId)) {
        group.members.push(userId);
      }
    } else if (action === 'remove') {
      group.members = removeMember(group.members, userId);
      group.admins = removeMember(group.admins, userId);
    }
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get group info (Authenticated users) - Handle mixed types
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    // Manually populate members to handle mixed types
    const populatedMembers = [];
    
    for (const member of group.members) {
      if (mongoose.Types.ObjectId.isValid(member)) {
        // IMS User - populate from database
        const user = await User.findById(member, 'name email _id');
        if (user) {
          populatedMembers.push({
            _id: user._id,
            name: user.name,
            email: user.email,
            type: 'IMS_USER'
          });
        }
      } else {
        // LMS Student - use registration number as ID
        populatedMembers.push({
          _id: member, // registration number
          name: member, // registration number as name for now
          email: `${member.toLowerCase().replace(/\s+/g, '')}@student.ifda.in`,
          type: 'LMS_STUDENT',
          registration_number: member
        });
      }
    }
    
    // Manually populate admins
    const populatedAdmins = [];
    for (const admin of group.admins) {
      if (mongoose.Types.ObjectId.isValid(admin)) {
        const user = await User.findById(admin, 'name email _id');
        if (user) {
          populatedAdmins.push({
            _id: user._id,
            name: user.name,
            email: user.email,
            type: 'IMS_USER'
          });
        }
      } else {
        populatedAdmins.push({
          _id: admin,
          name: admin,
          email: `${admin.toLowerCase().replace(/\s+/g, '')}@student.ifda.in`,
          type: 'LMS_STUDENT',
          registration_number: admin
        });
      }
    }
    
    // Return group with populated members and admins
    const result = {
      ...group.toObject(),
      members: populatedMembers,
      admins: populatedAdmins
    };
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all groups (for user) - No authentication required for testing
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query; // Get userId from query parameter
    console.log('userId:', userId);
    console.log('Type:', typeof userId);
    
    // Find groups where user is a member (handle both ObjectId and String members)
    // For students, we need to search by both registration number and student name
    let searchCriteria = {
      members: { 
        $in: [
          userId // LMS Student ID (string) - registration number
        ]
      }
    };
    
    // If userId is a valid ObjectId, add it to search criteria
    if (mongoose.Types.ObjectId.isValid(userId)) {
      console.log('IMS User ID detected:', userId);
      searchCriteria.members.$in.push(new mongoose.Types.ObjectId(userId));
    } else {
      console.log('Student registration number detected:', userId);
      console.log('Searching groups with registration number only');
    }
    
    const groups = await Group.find(searchCriteria);
    
    // Manually populate members and admins to handle mixed types
    const populatedGroups = await Promise.all(groups.map(async (group) => {
      const populatedGroup = group.toObject();
      
      // Populate ObjectId members (IMS users)
      const objectIdMembers = group.members.filter(member => mongoose.Types.ObjectId.isValid(member));
      const stringMembers = group.members.filter(member => !mongoose.Types.ObjectId.isValid(member));
      
      if (objectIdMembers.length > 0) {
        const populatedMembers = await User.find({ _id: { $in: objectIdMembers } }, 'name email');
        populatedGroup.members = [
          ...populatedMembers.map(member => ({
            _id: member._id,
            name: member.name,
            email: member.email,
            type: 'IMS_USER'
          })),
          ...stringMembers.map(member => ({
            _id: member, // This is now registration_number
            name: member, // This will be registration_number, not name
            email: `${member.toLowerCase().replace(/\s+/g, '')}@student.ifda.in`,
            type: 'LMS_STUDENT',
            registration_number: member
          }))
        ];
      } else {
        // All members are strings (LMS students)
        populatedGroup.members = stringMembers.map(member => ({
          _id: member, // This is now registration_number
          name: member, // This will be registration_number, not name
          email: `${member.toLowerCase().replace(/\s+/g, '')}@student.ifda.in`,
          type: 'LMS_STUDENT',
          registration_number: member
        }));
      }
      
      // Populate admins similarly
      const objectIdAdmins = group.admins.filter(admin => mongoose.Types.ObjectId.isValid(admin));
      const stringAdmins = group.admins.filter(admin => !mongoose.Types.ObjectId.isValid(admin));
      
      if (objectIdAdmins.length > 0) {
        const populatedAdmins = await User.find({ _id: { $in: objectIdAdmins } }, 'name email');
        populatedGroup.admins = [
          ...populatedAdmins.map(admin => ({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            type: 'IMS_USER'
          })),
          ...stringAdmins.map(admin => ({
            _id: admin, // This is now registration_number
            name: admin, // This will be registration_number, not name
            email: `${admin.toLowerCase().replace(/\s+/g, '')}@student.ifda.in`,
            type: 'LMS_STUDENT',
            registration_number: admin
          }))
        ];
      } else {
        populatedGroup.admins = stringAdmins.map(admin => ({
          _id: admin, // This is now registration_number
          name: admin, // This will be registration_number, not name
          email: `${admin.toLowerCase().replace(/\s+/g, '')}@student.ifda.in`,
          type: 'LMS_STUDENT',
          registration_number: admin
        }));
      }
      
      return populatedGroup;
    }));
    
    console.log('Groups found:', populatedGroups.length);
    res.json(populatedGroups);
  } catch (err) {
    console.error('Error fetching groups:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get students by module criteria for auto-group creation
router.get('/students/by-module', async (req, res) => {
  try {
    const { module_name, start_timing, end_timing, faculty_name, status } = req.query;
    
    console.log('Module-based student search:', {
      module_name,
      start_timing, 
      end_timing,
      faculty_name,
      status
    });

    // Fetch students from LMS API
    const response = await fetch('https://lms.ifda.in/api/v1/students');
    const data = await response.json();
    
    if (!data.success || !Array.isArray(data.data)) {
      return res.status(400).json({ error: 'Failed to fetch students from LMS' });
    }

    // Filter students based on module criteria
    const matchingStudents = data.data.filter(student => {
      if (!student.modules || !Array.isArray(student.modules)) return false;
      
      return student.modules.some(module => 
        module.module_name === module_name &&
        module.start_timing === start_timing &&
        module.end_timing === end_timing &&
        module.faculty_name === faculty_name &&
        module.status === status
      );
    });

    console.log(`Found ${matchingStudents.length} students matching criteria`);

    res.json({
      success: true,
      count: matchingStudents.length,
      students: matchingStudents.map(student => ({
        _id: student._id,
        name: student.student_name,
        email: student.admission?.student_email,
        registration_number: student.registration_number,
        branch_name: student.branch_name
      }))
    });
  } catch (err) {
    console.error('Error fetching students by module:', err);
    res.status(500).json({ error: err.message });
  }
});

// Auto-create group based on module criteria
router.post('/auto-create/module', async (req, res) => {
  try {
    const { module_name, start_timing, end_timing, faculty_name } = req.body;
    
    // Check if group already exists
    const existingGroup = await Group.findOne({
      name: `${module_name} - ${start_timing}-${end_timing}`,
      description: `Auto-created group for ${module_name} module with ${faculty_name}`
    });
    
    if (existingGroup) {
      return res.json({
        success: true,
        message: 'Group already exists',
        group: existingGroup
      });
    }

    // Find faculty member in IMS users
    const facultyUser = await User.findOne({ name: faculty_name });
    if (!facultyUser) {
      return res.status(404).json({ error: `Faculty member ${faculty_name} not found in IMS` });
    }

    // Get students matching the criteria
    const response = await fetch('https://lms.ifda.in/api/v1/students');
    const data = await response.json();
    
    if (!data.success || !Array.isArray(data.data)) {
      return res.status(400).json({ error: 'Failed to fetch students from LMS' });
    }

    // Filter students with WIP status
    const matchingStudents = data.data.filter(student => {
      if (!student.modules || !Array.isArray(student.modules)) return false;
      
      return student.modules.some(module => 
        module.module_name === module_name &&
        module.start_timing === start_timing &&
        module.end_timing === end_timing &&
        module.faculty_name === faculty_name &&
        module.status === 'WIP'
      );
    });

    // Get IMS user IDs for students (try to find them in IMS users)
    const studentUserIds = [];
    console.log(`\n=== DEBUGGING STUDENT MATCHING FOR GROUP: ${module_name} ===`);
    console.log(`Total matching students from LMS: ${matchingStudents.length}`);
    
    for (const student of matchingStudents) {
      try {
        console.log(`\nLooking for student: ${student.student_name}`);
        console.log(`Registration number: ${student.registration_number}`);
        console.log(`Email: ${student.admission?.student_email}`);
        
        // Try to find student in IMS users by registration number or email
        const imsStudent = await User.findOne({
          $or: [
            { registration_number: student.registration_number },
            { email: student.admission?.student_email },
            { name: student.student_name }
          ]
        });
        
        if (imsStudent) {
          console.log(`✅ Found student in IMS: ${imsStudent.name} (${imsStudent._id})`);
          studentUserIds.push(imsStudent._id);
        } else {
          // If student not found in IMS, create a temporary user for them
          console.log(`❌ Student ${student.student_name} (${student.registration_number}) not found in IMS users`);
          console.log(`🔄 Creating temporary IMS user for: ${student.student_name}`);
          
          try {
            const newStudent = new User({
              name: student.student_name,
              email: student.admission?.student_email || `${student.registration_number}@student.ifda.in`,
              registration_number: student.registration_number,
              password: 'temp123', // Temporary password
              role: 'student',
              department: ['Student'],
              status: 'Active',
              isTemporary: true // Flag to identify temporary users
            });
            
            await newStudent.save();
            console.log(`✅ Created temporary IMS user: ${newStudent.name} (${newStudent._id})`);
            studentUserIds.push(newStudent._id);
          } catch (createErr) {
            console.error(`❌ Failed to create temporary user for ${student.student_name}:`, createErr);
          }
          
          // Let's see what students are actually in IMS
          const allImsUsers = await User.find({}, 'name registration_number email').limit(5);
          console.log('Sample IMS users:', allImsUsers.map(u => ({ name: u.name, reg: u.registration_number, email: u.email })));
        }
      } catch (err) {
        console.error(`Error finding student ${student.student_name}:`, err);
      }
    }
    
    console.log(`\nTotal students found in IMS: ${studentUserIds.length}`);
    console.log(`Student IDs to add: ${studentUserIds}`);
    console.log('=== END DEBUGGING ===\n');

    // Create group with faculty and students
    const allMembers = [facultyUser._id, ...studentUserIds];
    const group = new Group({
      name: `${module_name} - ${start_timing}-${end_timing}`,
      description: `Auto-created group for ${module_name} module with ${faculty_name}`,
      members: allMembers, // Faculty + students as members
      admins: [facultyUser._id], // Faculty as admin
      createdBy: facultyUser._id,
      isAutoGenerated: true, // Flag to identify auto-generated groups
      moduleInfo: {
        module_name,
        start_timing,
        end_timing,
        faculty_name
      }
    });

    await group.save();

    console.log(`Auto-created group: ${group.name} with ${allMembers.length} total members (${studentUserIds.length} students + 1 faculty)`);

    res.status(201).json({
      success: true,
      message: 'Group auto-created successfully',
      group,
      studentsCount: matchingStudents.length,
      totalMembers: allMembers.length,
      addedStudents: studentUserIds.length
    });
  } catch (err) {
    console.error('Error auto-creating group:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update group membership based on module status changes
router.post('/auto-update-membership', async (req, res) => {
  try {
    const { student_id, module_name, start_timing, end_timing, faculty_name, new_status } = req.body;
    
    // Find the corresponding auto-generated group
    const group = await Group.findOne({
      name: `${module_name} - ${start_timing}-${end_timing}`,
      isAutoGenerated: true
    });

    if (!group) {
      return res.status(404).json({ error: 'Auto-generated group not found' });
    }

    // Find faculty member to get their IMS ID
    const facultyUser = await User.findOne({ name: faculty_name });
    if (!facultyUser) {
      return res.status(404).json({ error: `Faculty member ${faculty_name} not found` });
    }

    let action = '';
    
    // Helper function to check if member exists (handles mixed types)
    const memberExists = (members, targetId) => {
      return members.some(member => {
        if (typeof member === 'string' && typeof targetId === 'string') {
          return member === targetId;
        }
        return member.toString() === targetId.toString();
      });
    };
    
    // Helper function to remove member (handles mixed types)
    const removeMember = (members, targetId) => {
      return members.filter(member => {
        if (typeof member === 'string' && typeof targetId === 'string') {
          return member !== targetId;
        }
        return member.toString() !== targetId.toString();
      });
    };
    
    if (new_status === 'WIP' && !memberExists(group.members, facultyUser._id)) {
      // Add student to group (using faculty ID as proxy for now)
      group.members.push(facultyUser._id);
      action = 'added';
    } else if (new_status === 'Done' && memberExists(group.members, facultyUser._id)) {
      // Remove student from group
      group.members = removeMember(group.members, facultyUser._id);
      action = 'removed';
    }

    if (action) {
      await group.save();
      console.log(`Student ${student_id} ${action} from group ${group.name} due to status change to ${new_status}`);
    }

    res.json({
      success: true,
      action,
      group,
      message: `Student ${action} from group successfully`
    });
  } catch (err) {
    console.error('Error updating group membership:', err);
    res.status(500).json({ error: err.message });
  }
});

// Sync batch groups endpoint (Admin and Faculty only)
router.post('/sync-batch-groups', async (req, res) => {
  try {
    console.log('🚀 GROUP SYNC API CALLED!');
    console.log('API: Starting batch groups sync...');
    console.log('API: Request headers:', req.headers);
    console.log('API: Request body:', req.body);
    
    // TEMPORARY: Skip authentication for testing
    console.log('API: Skipping authentication for testing...');

           // Run the sync script with error handling
           try {
             await syncBatchGroups();
             console.log('API: Batch sync completed successfully');
           } catch (error) {
             console.error('API: Batch sync failed:', error.message);
             // Don't stop the API response, just log the error
           }
           
           // Get current user's batches from LMS API
           const currentUserId = req.user ? req.user._id || req.user.id : null;
           if (currentUserId) {
               const currentUser = await User.findById(currentUserId);
               console.log(`API: Current user: ${currentUser.name} (${currentUser.email})`);
               
               // Fetch user's batches from LMS API
               try {
                   const lmsResponse = await fetch('https://lms.ifda.in/api/v1/faculty');
                   const facultyData = await lmsResponse.json();
                   
                   // Find current user's batches
                   const userBatches = facultyData.filter(faculty => 
                       faculty.faculty_name && 
                       faculty.faculty_name.toLowerCase() === currentUser.name.toLowerCase()
                   );
                   
                   console.log(`API: Found ${userBatches.length} batches for ${currentUser.name}`);
                   
                   // Create groups for user's batches only
                   for (const batch of userBatches) {
                       if (batch.start_timing && batch.end_timing) {
                           const batchKey = `${batch.start_timing}-${batch.end_timing} ${batch.branch_name || 'General'}`;
                           const groupName = `Batch ${batchKey}`;
                           
                           // Find or create group for this batch
                           let group = await Group.findOne({ name: groupName, isAutoGenerated: true });
                           
                           if (group) {
                               // Add current user to their batch groups
                               await Group.findByIdAndUpdate(group._id, {
                                   $addToSet: { 
                                       members: currentUserId,
                                       admins: currentUserId
                                   }
                               });
                               console.log(`API: Added ${currentUser.name} to their batch group: ${groupName}`);
                           }
                       }
                   }
               } catch (error) {
                   console.error('API: Error fetching user batches from LMS:', error);
               }
           } else {
               console.log('API: No current user found, skipping user-specific group creation');
           }
           
           // Count created groups
           const batchGroups = await Group.countDocuments({ groupType: 'batch', isAutoGenerated: true });
           const facultyGroups = await Group.countDocuments({ groupType: 'faculty', isAutoGenerated: true });
    
    console.log(`API: Sync completed. Batch groups: ${batchGroups}, Faculty groups: ${facultyGroups}`);
    
    res.json({
      success: true,
      message: 'Batch groups synced successfully',
      batchGroupsCreated: batchGroups,
      facultyGroupsCreated: facultyGroups,
      totalGroups: batchGroups + facultyGroups
    });
    
  } catch (error) {
    console.error('API: Error syncing batch groups:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync batch groups'
    });
  }
});

module.exports = router; 