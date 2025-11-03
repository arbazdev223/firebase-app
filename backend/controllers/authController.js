const User = require('../models/User');  // Import your User model
const jwt = require('jsonwebtoken');    // Import JWT for token generation
const Sequence = require('../models/Sequence');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const Attendance = require("../models/Attendance");
// Configure R2 bucket (using AWS SDK)
const s3 = new AWS.S3({
    endpoint: 'https://582328aa44fe3bcd4d90060e0a558eae.r2.cloudflarestorage.com', // Updated environment variable name
    accessKeyId: '477949571b2baa26ff5b94195b93dd76', // Updated environment variable name
    secretAccessKey: 'd42e9da877365aabdbd7b59c1e3a543cb20ce4a321801b249f8e29c51fb6a7c8', // Updated environment variable name
    region: 'auto', // Updated environment variable name
});

const BUCKET_NAME = 'lms'; // Updated environment variable name

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });


// Login Route (POST /login)
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Set today's and tomorrow's date in UTC (MongoDB stores dates in UTC)
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  
  const localToday = new Date(now);
  const tomorrow = new Date(localToday);
  tomorrow.setUTCDate(localToday.getUTCDate() + 1);
  
  console.log('Login - Today (UTC):', localToday.toISOString());
  console.log('Login - Tomorrow (UTC):', tomorrow.toISOString());

  try {
    // Find the user by email and check status
    const user = await User.findOne({ email, password, status: "Active" });
    if (!user) {
      return res.status(404).json({ error: 'User is inactive or not found' });
    }

    // Get today's attendance
    const attendance = await Attendance.findOne({
      user_id: user._id,
      attendance_date: {
        $gte: localToday,
        $lt: tomorrow
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return user data with today's attendance
    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        ...user.toObject(),
        todayAttendance: attendance || null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
};

exports.register = async (req, res) => {
  const { email, location, branches, department, name, password, salary } = req.body;

  try {
    // Check if user already exists by email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User with this email already exists!' });
    }

    // Get the next user_code atomically
    const sequence = await Sequence.findOneAndUpdate(
      { key: 'user_code' }, // Identifier for the sequence
      { $inc: { value: 1 } }, // Increment the value
      { new: true, upsert: true } // Create the sequence if it doesn't exist
    );

    if (!sequence) {
      throw new Error('Unable to retrieve or create sequence.');
    }

    const userCode = sequence.value.toString().padStart(4, '0'); // Ensure 4-digit padding

    // Create a new user object
    const newUser = new User({
      user_code: userCode,
      name,
      email,
      password,
      location,
      branches, // Save the branches array directly
      department,
      salary,
      status: 'Active',
    });

    // Save the user to the database
    await newUser.save();

    // Send success response
    res.status(201).json({ message: 'User registered successfully!', user_code: newUser.user_code, name: newUser.name });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: error.message || 'Something went wrong during registration!' });
  }
};

exports.getusers = async (req, res) => {
  try {
    // Get today's date in UTC (MongoDB stores dates in UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Set time to midnight UTC

    // Set tomorrow's date in UTC
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    console.log("GetUsers - Today (UTC): ", today.toISOString());
    console.log("GetUsers - Tomorrow (UTC): ", tomorrow.toISOString());

    // Get all users
    const users = await User.find();

    // Get attendance data for each user
    const usersWithAttendance = await Promise.all(users.map(async (user) => {
      try {
        // Try to find today's attendance
        let attendance = await Attendance.findOne({
          user_id: user._id,
          attendance_date: {
            $gte: today, // Start of today (UTC)
            $lt: tomorrow // Start of the next day (UTC)
          }
        });

        // If no attendance found for today, try to find the most recent attendance
        if (!attendance) {
          attendance = await Attendance.findOne({
            user_id: user._id
          }).sort({ attendance_date: -1 });
        }

        // Debug logging for specific users
        if (user.name === 'admin' || user.name === 'Arbaz') {
          console.log(`\n=== DEBUG for ${user.name} ===`);
          console.log('User ID:', user._id);
          console.log('Searching attendance between:', today.toISOString(), 'and', tomorrow.toISOString());
          console.log('Found attendance:', attendance);
          
          // Check total attendance records for this user
          const totalAttendance = await Attendance.countDocuments({ user_id: user._id });
          console.log('Total attendance records for this user:', totalAttendance);
        }

        return {
          ...user.toObject(),
          todayAttendance: attendance || null
        };
      } catch (attendanceError) {
        console.error(`Error fetching attendance for user ${user.name}:`, attendanceError);
        return {
          ...user.toObject(),
          todayAttendance: null
        };
      }
    }));

    res.json(usersWithAttendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users with attendance' });
  }
};


exports.getusersbyfilters = async (req, res) => {
  try {
    console.log("Incoming Query Params:", req.query); // Debug

    let filters = {}; // Start with an empty filter

    if (req.query.department) {
      filters.department = req.query.department; // Directly assign the department filter
    }

    console.log("Filters Before Query:", filters); // Debugging log

    // Fetch users
    const users = await User.find(filters);

    console.log("Users Found:", users.length); // Debugging log

    if (!users || users.length === 0) {
      return res.status(404).json({ error: "No users found" });
    }

    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

exports.updateUser = async (req, res) => {
  const userId = req.params.id;
  const updatedData = req.body;

  try {
    console.log("UpdateUser called with userId:", userId);
    console.log("Request body:", req.body);
    console.log("File present:", !!req.file);

    let fileUrl = null;

    // Handle file upload
    if (req.file) {
      console.log("Processing file upload:", req.file.originalname);
      const fileKey = `user/thumb/${uuidv4()}_${req.file.originalname}`;
      
      try {
        await s3.upload({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        }).promise();
        
        fileUrl = `https://imsdata.ifda.in/${fileKey}`;
        updatedData.thumb = fileUrl;
        console.log("File uploaded successfully:", fileUrl);
      } catch (uploadError) {
        console.error("S3 upload error:", uploadError);
        return res.status(500).json({ error: 'Failed to upload file', details: uploadError.message });
      }
    }

    const user = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
      runValidators: true,
    });
  
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
  
    console.log("User updated successfully:", user._id);
    res.json(user);
  } catch (err) {
    console.error("Error details:", err);  // Log the error details
    res.status(500).json({ error: 'Failed to update user', details: err.message });
  }
};

exports.getUserById = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Error details:", err);
    res.status(500).json({ error: 'Failed to fetch user', details: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error("Error details:", err);  // Log the error details
    res.status(500).json({ error: 'Failed to delete user', details: err.message });
  }
};