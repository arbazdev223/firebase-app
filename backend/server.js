const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cron = require('node-cron');
const { exec } = require('child_process');
const { connectMongoDB } = require('./config/db');
const salarySlipController = require('./controllers/salarySlipController');

// Set timezone to IST for consistent time handling
process.env.TZ = 'Asia/Kolkata';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Increase request payload limit for large file uploads
app.use(express.json({ limit: '100mb' })); 
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Add security headers
app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://ifda.in',
    'https://ims.ifda.in',
    'https://test.ifda.in',
    /\.ifda\.in$/,
    '*' // Temporary fix for development
];

app.use(cors({
    origin: function (origin, callback) {
        console.log('Request origin:', origin);  // Log the origin
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Temporary: Allow all origins for development
        return callback(null, true);
        
        // Check if origin is in allowed list or matches pattern
        if (allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return allowedOrigin === origin;
            } else if (allowedOrigin instanceof RegExp) {
                return allowedOrigin.test(origin);
            }
            return false;
        })) {
            return callback(null, true);
        }
        
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', cors({
    origin: function (origin, callback) {
        console.log('Preflight request origin:', origin);
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Temporary: Allow all origins for development
        return callback(null, true);
        
        // Check if origin is in allowed list or matches pattern
        if (allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return allowedOrigin === origin;
            } else if (allowedOrigin instanceof RegExp) {
                return allowedOrigin.test(origin);
            }
            return false;
        })) {
            return callback(null, true);
        }
        
        console.log('CORS preflight blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true
}));

// Create HTTP server
const server = http.createServer(app);

// Socket.io Configuration
const io = new Server(server, {
    cors: {
        origin: function (origin, callback) {
            console.log('Socket.io origin:', origin);
            // Allow requests with no origin
            if (!origin) return callback(null, true);
            
            // Temporary: Allow all origins for development
            return callback(null, true);
            
            // Check if origin is in allowed list or matches pattern
            if (allowedOrigins.some(allowedOrigin => {
                if (typeof allowedOrigin === 'string') {
                    return allowedOrigin === origin;
                } else if (allowedOrigin instanceof RegExp) {
                    return allowedOrigin.test(origin);
                }
                return false;
            })) {
                return callback(null, true);
            }
            
            console.log('Socket.io CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH'],
        credentials: true
    },
    path: '/api/socket.io', // Ensure it matches frontend requests
    transports: ['websocket', 'polling'], // Support both transports
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    upgradeTimeout: 10000, // 10 seconds
    allowEIO3: true, // Allow Engine.IO v3 clients
    allowEIO4: true, // Allow Engine.IO v4 clients
    maxHttpBufferSize: 1e6, // 1MB
    serveClient: false, // Don't serve the client
    connectTimeout: 45000, // 45 seconds
    forceNew: false, // Reuse existing connection
});

// Expose io to routes/controllers for emitting events
app.set('io', io);

// ? Function to run script.js
function runScript() {
    console.log(`?? Running syncAttendance.js at ${new Date().toLocaleTimeString()}`);
    exec('node syncAttendance.js', (error, stdout, stderr) => {
      if (error) {
        console.error(`? Error executing syncAttendance.js: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`?? syncAttendance.js stderr: ${stderr}`);
        return;
      }
      console.log(`? syncAttendance.js output:\n${stdout}`);
    });
  }
  
  // ?? Every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
  
    const isMorningShift = (hours >= 8 && hours < 11); // 08:00 to 10:59
    const isEveningShift = (hours >= 16 && (hours < 20 || (hours === 20 && minutes === 0))); // 16:30 to 20:00
  
    if (isMorningShift || (hours === 16 && minutes >= 30) || isEveningShift) {
      runScript();
    } else {
      console.log(`? Outside active hours: ${hours}:${minutes < 10 ? '0' + minutes : minutes}`);
    }
  });

// MongoDB connection with timeout settings
connectMongoDB();

// Import Routes
const userRoutes = require('./routes/authRoutes');
const checklistRoutes = require('./routes/userRoutes');
const enqureRoutes = require('./routes/enqureRoutes');
const demoRoutes = require('./routes/demoRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const hrRoutes = require('./routes/hrRoutes');
const formRoutes = require('./routes/formRoutes');
const testRoutes = require('./routes/testRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const groupRoutes = require('./routes/groupRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const noteReminderRoutes = require('./routes/noteReminderRoutes');
const attendanceRoutes = require('./routes/mysqlRoutes');
const socketSetup = require('./socket');
const leaveRoutes = require('./routes/leaveRoutes');
const ProjectRoutes = require('./routes/ProjectRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const faqsRoutes = require('./routes/faqsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const taskRoutes = require('./routes/taskRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const eventRoutes = require('./routes/eventRoutes'); 
const meetingRemarkRoutes = require('./routes/meetingRemarkRoutes');
const templateRoutes = require('./routes/templateroutes');
const incentiveRoutes = require('./routes/incentiveRoutes');
const batchTimingRoutes = require('./routes/batchTimingRoutes');
const userprojectRoutes = require('./routes/userProjectRoutes');
const attendanceLogicRoutes = require('./routes/attendanceRoutes');
const jobRoutes = require('./routes/jobListingRoutes');
const salarySlipRoutes = require('./routes/salarySlipRoutes');
const fileRoutes = require('./routes/fileRoutes');
const seoTrackingRoutes = require('./routes/seoTrackingRoutes');
const Bachecalls = require('./routes/bachecallsRoutes');
const quickInsertRoutes = require('./routes/quickInsertRoutes');
const finalStudentFeedbackRoutes = require('./routes/finalStudentFeedbackRoutes');
const courseMcqTestRoutes = require('./routes/courseMcqTestRoutes');
const reportRoutes = require('./routes/reportRoutes');
const myOperatorRoutes = require('./routes/myOperatorRoutes');
// const taskRoutes = require('./routes/taskRoutes');

// Define Routes
// app.use('/api/tasks', taskRoutes);
app.use('/api/bachecalls', Bachecalls);
app.use('/api/jobs', jobRoutes);
app.use('/api/attendance', attendanceLogicRoutes);
app.use('/api/user/projects', userprojectRoutes);
app.use('/api/incentives', incentiveRoutes);
app.use('/api/batch-timings', batchTimingRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/notesReminders', noteReminderRoutes);
app.use('/api/forms', formRoutes);
app.use('/api', userRoutes);
app.use('/api', checklistRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api', assignmentRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/enquiries', enqureRoutes);
app.use('/api', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/Project', ProjectRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api', faqsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api', eventRoutes);
app.use('/api', meetingRemarkRoutes);
app.use('/api', templateRoutes);
app.use('/api/salary-slip', salarySlipRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/seo-tracking', seoTrackingRoutes);
app.use('/api/quick-insert', quickInsertRoutes);
app.use('/api/final-student-feedback', finalStudentFeedbackRoutes);
app.use('/api/course-mcq-tests', courseMcqTestRoutes);
app.use('/api/myoperator', myOperatorRoutes);
app.use('/api/reports', reportRoutes);

// Root Route
app.get('/api/', (req, res) => {
    res.send('?? Server is running successfully!');
});

// Initialize Socket.io
socketSetup(io);

// Increase Server Timeout (Fix 504 Gateway Timeout Issue)
server.timeout = 300000; // 5 minutes

// Start Server
const PORT = process.env.PORT || 5000;
// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit process, just log the error
});

server.listen(PORT, () => console.log(`? Server running on port ${PORT}`));

cron.schedule('0 0 1 * *', async () => {
  // Run at midnight on the 1st of every month
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const month = `${lastMonth.getFullYear()}-${(lastMonth.getMonth() + 1).toString().padStart(2, '0')}`;
  try {
    await salarySlipController.generateMonthlySlips({ body: { month } }, { json: () => {} });
    console.log(`Salary slips generated for ${month}`);
  } catch (err) {
    console.error('Error generating monthly salary slips:', err);
  }
});