const AWS = require('aws-sdk');
const multer = require('multer');
const Project = require('../models/ProjectAssignBox'); // Assuming this model exists
const dotenv = require('dotenv');
dotenv.config();  // Load environment variables from .env

// Configure R2 bucket (using AWS SDK)
const s3 = new AWS.S3({
    endpoint: process.env.R2_ENDPOINT, // Cloudflare R2 endpoint from environment variables
    accessKeyId: process.env.R2_ACCESS_KEY, // R2 access key from environment variables
    secretAccessKey: process.env.R2_SECRET_KEY, // R2 secret key from environment variables
    region: 'auto', // R2 region
});

const BUCKET_NAME = 'lms'; // Name of the R2 bucket

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB file size limit

// Create a new task with file upload
exports.createTask = async (req, res) => {
    upload.single('file')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, error: 'File upload failed or file size too large' });
        }

        try {
            const { faculty_id, taskName, branches, courses, students, description, targetDate } = req.body;

            let filePath = null;

            // Check if a file is uploaded
            if (req.file) {
                const file = req.file;
                const fileKey = `student/project/${Date.now()}_${file.originalname}`;

                // Upload file to R2 bucket
                const uploadResult = await s3
                    .upload({
                        Bucket: BUCKET_NAME,
                        Key: fileKey,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                        ACL: 'public-read', // Make file publicly accessible (optional)
                    })
                    .promise();
                filePath = `${'https://imsdata.ifda.in/'}${fileKey}`;
            }

            // Create a new task in MongoDB
            const task = await Project.create({
                faculty_id,
                taskName,
                branches,
                courses,
                students,
                description,
                filePath, // Store the file URL in the task
                targetDate,
            });

            res.status(201).json({ success: true, data: task });
        } catch (error) {
            console.error(error);  // Log error for debugging
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    });
};

// Get all tasks
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Project.find().populate('faculty_id', 'name email'); // Populate faculty details
        res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        console.error(error);  // Log error for debugging
        res.status(500).json({ success: false, error: 'Failed to retrieve tasks' });
    }
};

// Get a single task by ID
exports.getTaskById = async (req, res) => {
    try {
        const task = await Project.findById(req.params.id).populate('faculty_id', 'name email');
        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        res.status(200).json({ success: true, data: task });
    } catch (error) {
        console.error(error);  // Log error for debugging
        res.status(500).json({ success: false, error: 'Failed to retrieve task' });
    }
};

// Update a task
exports.updateTask = async (req, res) => {
    // Use multer for file upload
    upload.single('file')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, error: 'File upload failed or file size too large' });
        }

        try {
            const { student_id, description, grade } = req.body;
            let fileUrl = null;

            // Check if a file is uploaded
            if (req.file) {
                const file = req.file;
                const fileKey = `student_submissions/${Date.now()}_${file.originalname}`;

                // Upload file to R2 bucket
                const uploadResult = await s3
                    .upload({
                        Bucket: BUCKET_NAME,
                        Key: fileKey,
                        Body: file.buffer,
                        ContentType: file.mimetype,
                        ACL: 'public-read', // Make file publicly accessible
                    })
                    .promise();

                fileUrl = `${'https://imsdata.ifda.in/'}${fileKey}`;
            }

            // Find the task and update the specific student's data
            const task = await Project.findById(req.params.id);
            if (!task) {
                return res.status(404).json({ success: false, error: 'Task not found' });
            }

            const student = task.students.find((s) => s.student_id === student_id);
            if (!student) {
                return res.status(404).json({ success: false, error: 'Student not found in task' });
            }

            // Update student's submission details
            student.description = description || student.description;
            student.file = fileUrl || student.file;
            student.grade = grade || student.grade;

            // Save the updated task
            await task.save();

            res.status(200).json({ success: true, data: task });
        } catch (error) {
            console.error(error);  // Log error for debugging
            res.status(500).json({ success: false, error: 'Failed to update task' });
        }
    });
};
