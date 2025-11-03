const TestBackup = require('../models/TestBackup');
const Test = require('../models/Test');
const AWS = require('aws-sdk');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

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

exports.createTest = async (req, res) => {
  try {
    console.log('Request Body:', req.body); // Debugging request body
    console.log('Request File:', req.file); // Debugging file upload

    let { userId, course, module, questions } = req.body;

    // Ensure `questions` is parsed as JSON if it arrives as a string
    if (typeof questions === 'string') {
      try {
        questions = JSON.parse(questions);
      } catch (error) {
        console.error('JSON Parse Error:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON format in questions field',
        });
      }
    }

    // Log after parsing
    console.log('Parsed Questions:', questions);

    // Validate required fields
    if (!userId || !course || !module || !Array.isArray(questions) || questions.length === 0) {
      console.error('Validation Failed:', { userId, course, module, questions });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields or questions array is invalid',
      });
    }

    // Validate each question
    for (const question of questions) {
      if (
        !question.question ||
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        !question.rightAnswer
      ) {
        console.error('Question Validation Failed:', question);
        return res.status(400).json({
          success: false,
          message: 'Each question must have a question text, 4 options, and a rightAnswer',
        });
      }
    }

    console.log('Validation Passed! Proceeding to DB save...');

    let thumbUrl = null;

    // Handle file upload (if a file is provided)
    if (req.file) {
      console.log('File Received:', req.file);
      const file = req.file;
      const fileName = `test/thumbs/${uuidv4()}-${file.originalname}`;

      const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      // Upload the file to S3 and get the URL
      const uploadResult = await s3.upload(params).promise();
      console.log('Upload Result:', uploadResult);
      thumbUrl = `https://imsdata.ifda.in/${fileName}`;
    }

    // Save test to the database
    const newTest = new Test({
      userId,
      course,
      module,
      questions,
      thumb: thumbUrl, // Save thumbnail URL
    });

    const savedTest = await newTest.save();

    return res.status(201).json({
      success: true,
      data: savedTest,
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all tests
exports.getAllTests = async (req, res) => {
  try {
    const tests = await Test.find().populate('userId', 'name email'); // Populating User data
    res.status(200).json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTestsByModule = async (req, res) => {
  try {
    const { course } = req.query;

    if (!course) {
      return res.status(400).json({ success: false, message: 'No course name provided' });
    }

    // Normalize input: support multiple comma-separated courses
    const courseArray = course
      .split(',')
      .map(c => {
        const normalized = c.trim().replace(/-/g, ' ');
        return new RegExp(`^${normalized}$`, 'i'); // exact match, case-insensitive
      });

    // Find tests where "course" array contains any of the requested courses
    const tests = await Test.find({
      course: { $in: courseArray }
    }).populate({ path: 'userId', select: 'name email' });

    return res.status(200).json({ success: true, data: tests });
  } catch (error) {
    console.error('Error fetching tests by course:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching tests by course',
      error: error.message,
    });
  }
};


// Get a single test by ID
exports.getTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await Test.findById(id).populate('userId', 'name email');

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    res.status(200).json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };

    // Parse course array if needed
    if (typeof updatedData.course === 'string') {
      try {
        updatedData.course = JSON.parse(updatedData.course);
      } catch {
        updatedData.course = [updatedData.course];
      }
    }

    // Parse questions array if needed
    if (typeof updatedData.questions === 'string') {
      try {
        updatedData.questions = JSON.parse(updatedData.questions);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid JSON format for questions' });
      }
    }


    let thumbUrl = null;

    // Handle file upload
    if (req.file) {
      const file = req.file;
      const fileName = `test/thumbs/${uuidv4()}-${file.originalname}`;
      const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      const uploadResult = await s3.upload(params).promise();
      thumbUrl = `https://imsdata.ifda.in/${fileName}`;
    }

    const existingTest = await Test.findById(id);
    if (!existingTest) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    // Backup original test data
    const backupData = {
      userId: existingTest.userId,
      course: existingTest.course,
      module: existingTest.module,
      questions: existingTest.questions,
    };

    const changes = trackChanges(existingTest, {
      ...updatedData,
      ...(thumbUrl && { thumb: thumbUrl }),
    });

    const testBackup = new TestBackup({
      originalTestId: existingTest._id,
      userId: existingTest.userId,
      backupData,
      changes,
    });

    await testBackup.save();

    if (thumbUrl) {
      updatedData.thumb = thumbUrl;
    }

    // Ensure `course` is always an array if present
    if (typeof updatedData.course === 'string') {
      updatedData.course = [updatedData.course];
    }

    const updatedTest = await Test.findByIdAndUpdate(id, updatedData, { new: true });

    res.status(200).json({ success: true, message: 'Test updated successfully', data: updatedTest });
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

function trackChanges(existingTest, updatedData) {
  const changes = [];

  const existingCourse = Array.isArray(existingTest.course) ? existingTest.course : [];
  const updatedCourse = Array.isArray(updatedData.course) ? updatedData.course : [];

  if (existingCourse.toString() !== updatedCourse.toString()) {
    changes.push(`Course changed: ${existingCourse} -> ${updatedCourse}`);
  }

  if (existingTest.module !== updatedData.module) {
    changes.push(`Module changed: ${existingTest.module} -> ${updatedData.module}`);
  }

  if (Array.isArray(existingTest.questions) && Array.isArray(updatedData.questions)) {
    existingTest.questions.forEach((question, index) => {
      const updatedQuestion = updatedData.questions[index];
      if (updatedQuestion) {
        if (question.question !== updatedQuestion.question) {
          changes.push(`Question #${index + 1} changed: ${question.question} -> ${updatedQuestion.question}`);
        }

        if (JSON.stringify(question.options) !== JSON.stringify(updatedQuestion.options)) {
          changes.push(`Options for Question #${index + 1} changed.`);
        }

        if (question.rightAnswer !== updatedQuestion.rightAnswer) {
          changes.push(`Right Answer for Question #${index + 1} changed: ${question.rightAnswer} -> ${updatedQuestion.rightAnswer}`);
        }
      }
    });
  }

  return changes.join(', ');
}


// Delete a test by ID
exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if test exists
    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    // Create a backup before deletion
    const backupData = {
      userId: test.userId,
      course: test.course,
      module: test.module,
      questions: test.questions,
    };

    const testBackup = new TestBackup({
      originalTestId: test._id,
      userId: test.userId,
      backupData,
      changes: 'Deleted test',
    });

    await testBackup.save();

    // Delete the test
    await Test.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Test deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting test:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
