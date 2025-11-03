const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');
const Group = require('../models/Group');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Fix path to .env file
const crypto = require('crypto'); // For generating random password

const FACULTY_API_URL = 'https://lms.ifda.in/api/v1/fetchfacultyinfo';
const STUDENTS_API_URL = 'https://lms.ifda.in/api/v1/students';

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected...');
      return;
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err; // Don't exit process, let caller handle
  }
};

// Function to fetch data from an API
const fetchData = async (url) => {
  try {
    const response = await axios.get(url);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error.message);
    return [];
  }
};

// Sync users (faculty only - students are not added to database)
const syncUsers = async (students) => {
  console.log('IMS: Skipping student sync - only using existing users in database');
  console.log(`IMS: Found ${students.length} students in LMS data, but not adding them to database`);
  
  // We don't add students to the database, only use existing users
  // This function is kept for compatibility but does nothing
  console.log('IMS: No users synced - using existing database users only');
};


// Main function to sync groups
const syncBatchGroups = async () => {
  try {
    console.log('Starting batch group sync...');
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, connecting...');
      await connectDB();
    }

    // 1. Fetch data
    const facultyData = await fetchData(FACULTY_API_URL);
    const studentData = await fetchData(STUDENTS_API_URL);

    if (!facultyData.length || !studentData.length) {
      console.log('Could not fetch data from APIs. Aborting sync.');
      return;
    }

  // 2. Sync users (ensure students are in the DB)
  await syncUsers(studentData);
  
  // 3. Process data and create/update groups
  const batchGroups = {}; // Store members for batch-wise groups
  const facultyGroups = {}; // Store members for faculty-wise groups

  // Group students by their batch timings, branch name, and faculty name (timing + branch + faculty groups)
  studentData.forEach(student => {
    if (student.modules && student.modules.length > 0) {
      student.modules.forEach(module => {
        // Only consider modules that are currently in progress ('WIP')
        if (module.start_timing && module.end_timing && module.status === 'WIP' && module.faculty_name) {
          // Create batch key by timing + branch + faculty: "14:30-15:30 Kalkaji Vikash"
          const batchKey = `${module.start_timing}-${module.end_timing} ${student.branch_name || 'General'} ${module.faculty_name}`;
          if (!batchGroups[batchKey]) {
            batchGroups[batchKey] = { 
              students: new Set(), 
              faculty: new Set(),
              modules: new Set(), // Store all modules for this timing+branch+faculty
              moduleInfo: {
                startTiming: module.start_timing,
                endTiming: module.end_timing,
                branchName: student.branch_name || 'General',
                facultyName: module.faculty_name // Single faculty name
              }
            };
          }
          // Add faculty to batch group (only one faculty per group)
          batchGroups[batchKey].faculty.add(module.faculty_name);
          // Add module to the set of modules for this timing+branch+faculty
          batchGroups[batchKey].modules.add(module.module_name);
          // Add students to batch group using registration_number as ID
          batchGroups[batchKey].students.add(student.registration_number);
          console.log(`IMS: Found student ${student.student_name} (${student.registration_number}) for faculty ${module.faculty_name} in batch ${batchKey} with module ${module.module_name} (will add to group)`);
        }
      });
    }
  });

  // Group faculty by their batch timings, branch name, and faculty name (timing + branch + faculty groups)
  facultyData.forEach(faculty => {
    if (faculty.start_timing && faculty.end_timing && faculty.faculty_name) {
      // Create batch key by timing + branch + faculty: "14:30-15:30 Kalkaji Vikash"
      const batchKey = `${faculty.start_timing}-${faculty.end_timing} ${faculty.branch_name || 'General'} ${faculty.faculty_name}`;
      if (!batchGroups[batchKey]) {
        batchGroups[batchKey] = { 
          students: new Set(), 
          faculty: new Set(),
          modules: new Set(), // Store all modules for this timing+branch+faculty
          moduleInfo: {
            startTiming: faculty.start_timing,
            endTiming: faculty.end_timing,
            branchName: faculty.branch_name || 'General',
            facultyName: faculty.faculty_name // Single faculty name
          }
        };
      }
      // Add faculty to batch group (only one faculty per group)
      batchGroups[batchKey].faculty.add(faculty.faculty_name);
      if (faculty.module_name) {
        batchGroups[batchKey].modules.add(faculty.module_name);
      }
    }
  });

  // Group students by faculty (Faculty-wise groups)
  studentData.forEach(student => {
    if (student.modules && student.modules.length > 0) {
      student.modules.forEach(module => {
        // Only consider modules that are currently in progress ('WIP')
        if (module.status === 'WIP' && module.faculty_name) {
          const facultyKey = module.faculty_name; // e.g., "Vikash"
          if (!facultyGroups[facultyKey]) {
            facultyGroups[facultyKey] = { students: new Set(), faculty: new Set() };
          }
          // Add students to faculty groups using registration_number as ID
          facultyGroups[facultyKey].students.add(student.registration_number);
          console.log(`IMS: Found student ${student.student_name} (${student.registration_number}) for faculty ${facultyKey} (will add to faculty group)`);
        }
      });
    }
  });

  // Add faculty to faculty-wise groups
  facultyData.forEach(faculty => {
    if (faculty.faculty_name) {
      const facultyKey = faculty.faculty_name;
      if (!facultyGroups[facultyKey]) {
        facultyGroups[facultyKey] = { students: new Set(), faculty: new Set() };
      }
      facultyGroups[facultyKey].faculty.add(faculty.faculty_name);
    }
  });

  // 4. Create/update batch-wise groups in DB (All specific groups)
  const batchKeys = Object.keys(batchGroups);
  console.log(`Creating ${batchKeys.length} specific batch groups...`);
  
  for (const batchKey of batchKeys) {
    const groupName = `Batch ${batchKey}`;
    const facultyNames = Array.from(batchGroups[batchKey].faculty);
    const moduleInfo = batchGroups[batchKey].moduleInfo;
    const modules = Array.from(batchGroups[batchKey].modules);

    console.log(`Creating timing+branch+faculty batch group: ${groupName}`);
    console.log(`Modules in this batch:`, modules);
    console.log(`Faculty from LMS: ${facultyNames.length} (students not added to database)`);
    console.log(`LMS Faculty names:`, facultyNames);

    // Find faculty users from existing database (case-insensitive matching)
    const facultyUsers = await User.find({ 
      name: { $regex: new RegExp(`^(${facultyNames.join('|')})$`, 'i') }, 
      department: 'Faculty' 
    }); 

    // Add students to group using LMS registration numbers (without adding to IMS database)
    const studentRegistrationNumbers = Array.from(batchGroups[batchKey].students);
    console.log(`LMS Student registration numbers for batch ${batchKey}:`, studentRegistrationNumbers);
    console.log(`Students will be added to group using LMS registration numbers (not added to IMS database)`);

    console.log(`Found ${facultyUsers.length} faculty users in database`);
    console.log(`Found ${studentRegistrationNumbers.length} students from LMS API`);

    // Add both faculty (IMS User IDs) and students (LMS registration numbers) to the group
    const memberIds = [
      ...facultyUsers.map(u => u._id), // IMS User IDs
      ...studentRegistrationNumbers // LMS Student registration numbers
    ];

    if (memberIds.length > 0) {
      // Convert Sets to Arrays for storage
      const finalModuleInfo = {
        startTiming: moduleInfo.startTiming,
        endTiming: moduleInfo.endTiming,
        branchName: moduleInfo.branchName,
        facultyName: moduleInfo.facultyName, // Single faculty name
        modules: modules
      };

      await Group.findOneAndUpdate(
        { name: groupName },
        {
          name: groupName,
          $addToSet: { members: { $each: memberIds } },
          description: `Auto-generated batch group for ${moduleInfo.startTiming}-${moduleInfo.endTiming} at ${moduleInfo.branchName} with ${moduleInfo.facultyName} (${modules.length} modules: ${modules.join(', ')})`,
          admins: facultyUsers.map(u => u._id),
          isAutoGenerated: true,
          groupType: 'batch',
          moduleInfo: finalModuleInfo // Store module information
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Timing+Branch+Faculty Batch Group "${groupName}" synced with ${memberIds.length} members (${facultyUsers.length} faculty + ${studentRegistrationNumbers.length} students) covering ${modules.length} modules.`);
    } else {
      console.log(`❌ No faculty members found for batch group: ${groupName}`);
    }
  }
  
  if (batchKeys.length === 0) {
    console.log('❌ No specific batch groups found to create');
  }

  // 5. Create/update faculty-wise groups in DB (ENABLED)
  console.log(`Faculty groups found: ${Object.keys(facultyGroups).length}`);
  for (const facultyKey in facultyGroups) {
    const groupName = `${facultyKey} - Students`;
    const studentRegistrationNumbers = Array.from(facultyGroups[facultyKey].students);
    const facultyNames = Array.from(facultyGroups[facultyKey].faculty);

    console.log(`Creating faculty group: ${groupName}`);
    console.log(`Faculty from LMS: ${facultyNames.length}`);
    console.log(`Students from LMS: ${studentRegistrationNumbers.length}`);
    console.log(`LMS Faculty names:`, facultyNames);
    console.log(`LMS Student registration numbers:`, studentRegistrationNumbers);

    // Find only the specific faculty user (case-insensitive matching)
    const facultyUsers = await User.find({ 
      name: { $regex: new RegExp(`^${facultyKey}$`, 'i') }, 
      department: 'Faculty' 
    }); 

    console.log(`Found ${facultyUsers.length} faculty users for ${facultyKey}`);

    // Add students to group using LMS registration numbers (without adding to IMS database)
    console.log(`LMS Student registration numbers for faculty ${facultyKey}:`, studentRegistrationNumbers);
    console.log(`Students will be added to group using LMS registration numbers (not added to IMS database)`);

    // Add both faculty (IMS User IDs) and students (LMS registration numbers) to the group
    const memberIds = [
      ...facultyUsers.map(u => u._id), // IMS User IDs
      ...studentRegistrationNumbers // LMS Student registration numbers
    ];

    if (memberIds.length > 0) {
      await Group.findOneAndUpdate(
        { name: groupName },
        {
          name: groupName,
          $addToSet: { members: { $each: memberIds } },
          description: `Auto-generated faculty group for ${facultyKey} (Faculty + Students)`,
          admins: facultyUsers.map(u => u._id),
          isAutoGenerated: true,
          groupType: 'faculty'
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Faculty Group "${groupName}" synced with ${memberIds.length} members (${facultyUsers.length} faculty + ${studentRegistrationNumbers.length} students).`);
    } else {
      console.log(`❌ No members found for faculty group: ${groupName}`);
    }
  }

    console.log('Batch group sync finished.');
  } catch (error) {
    console.error('Error in syncBatchGroups:', error);
    throw error; // Re-throw to let caller handle
  }
};

// Only run sync if this file is executed directly (not when required)
if (require.main === module) {
  connectDB().then(() => {
    syncBatchGroups().catch(error => {
      console.error('Sync failed:', error);
      // Don't exit process when called from API routes
      // process.exit(1);
    });
  }).catch(error => {
    console.error('Database connection failed:', error);
    // Don't exit process when called from API routes  
    // process.exit(1);
  });
}

module.exports = syncBatchGroups; 