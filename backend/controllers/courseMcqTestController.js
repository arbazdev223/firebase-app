const mongoose = require('mongoose');
const CourseMcqTest = require('../models/CourseMcqTest');
const CourseMcqAttempt = require('../models/CourseMcqAttempt');

const DEFAULT_PASS_PERCENTAGE = 70;

const toTrimmed = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.toString().trim();
  return trimmed || undefined;
};

const normaliseOption = (option) => {
  if (typeof option === 'string') {
    return { text: option.trim() };
  }
  if (option && typeof option === 'object') {
    return { text: toTrimmed(option.text) || '' };
  }
  return { text: '' };
};

const prepareQuestions = (rawQuestions = []) => {
  if (!Array.isArray(rawQuestions) || !rawQuestions.length) {
    throw new Error('At least one question is required.');
  }

  return rawQuestions.map((question, index) => {
    if (!question) {
      throw new Error(`Question at position ${index + 1} is invalid.`);
    }
    const prompt = toTrimmed(question.prompt);
    if (!prompt) {
      throw new Error(`Question ${index + 1} prompt is required.`);
    }

    const options = (question.options || []).map(normaliseOption).filter((opt) => opt.text);
    if (options.length < 2 || options.length > 6) {
      throw new Error(`Question ${index + 1} must have between 2 and 6 valid options.`);
    }

    const correctIndex = Number(question.correctOptionIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      throw new Error(`Question ${index + 1} correctOptionIndex is out of bounds.`);
    }

    const explanation = toTrimmed(question.explanation) || '';

    return {
      prompt,
      options,
      correctOptionIndex: correctIndex,
      explanation,
    };
  });
};

const sanitiseTestForResponse = (testDoc, { includeAnswers = false } = {}) => {
  if (!testDoc) return null;
  const base = {
    id: testDoc._id.toString(),
    title: testDoc.title,
    description: testDoc.description,
    courseName: testDoc.courseName,
    courseCode: testDoc.courseCode,
    passPercentage: testDoc.passPercentage,
    durationMinutes: testDoc.durationMinutes,
    maxAttemptsPerStudent: testDoc.maxAttemptsPerStudent,
    isActive: testDoc.isActive,
    metadata: testDoc.metadata,
    createdAt: testDoc.createdAt,
    updatedAt: testDoc.updatedAt,
  };

  base.questions = testDoc.questions.map((question) => {
    const sanitized = {
      id: question._id.toString(),
      prompt: question.prompt,
      options: question.options.map((option, optIndex) => ({
        index: optIndex,
        text: option.text,
      })),
    };

    if (includeAnswers) {
      sanitized.correctOptionIndex = question.correctOptionIndex;
      sanitized.explanation = question.explanation;
    }

    return sanitized;
  });

  return base;
};

const buildFilterFromQuery = (query = {}) => {
  const filter = {};
  if (query.courseName) {
    filter.courseName = query.courseName;
  }
  if (query.courseCode) {
    filter.courseCode = query.courseCode;
  }
  if (query.isActive !== undefined) {
    const active = query.isActive;
    if (active === 'true' || active === true) filter.isActive = true;
    if (active === 'false' || active === false) filter.isActive = false;
  }
  return filter;
};

exports.createCourseMcqTest = async (req, res) => {
  try {
    const title = toTrimmed(req.body.title);
    const courseName = toTrimmed(req.body.courseName);

    if (!title || !courseName) {
      return res.status(400).json({ message: 'title and courseName are required.' });
    }

    const test = await CourseMcqTest.create({
      title,
      description: toTrimmed(req.body.description) || '',
      courseName,
      courseCode: toTrimmed(req.body.courseCode) || '',
      passPercentage:
        Number.isFinite(req.body.passPercentage) && req.body.passPercentage >= 0 && req.body.passPercentage <= 100
          ? req.body.passPercentage
          : DEFAULT_PASS_PERCENTAGE,
      durationMinutes: Number.isFinite(req.body.durationMinutes) ? Math.max(0, req.body.durationMinutes) : 0,
      maxAttemptsPerStudent: Number.isFinite(req.body.maxAttemptsPerStudent)
        ? Math.max(0, Math.floor(req.body.maxAttemptsPerStudent))
        : 0,
      isActive: req.body.isActive === undefined ? true : Boolean(req.body.isActive),
      questions: prepareQuestions(req.body.questions),
      metadata: {
        createdBy: toTrimmed(req.body.metadata && req.body.metadata.createdBy) || '',
        tags: Array.isArray(req.body.metadata && req.body.metadata.tags)
          ? req.body.metadata.tags
              .map((tag) => toTrimmed(tag))
              .filter(Boolean)
          : [],
      },
    });

    return res.status(201).json(sanitiseTestForResponse(test, { includeAnswers: true }));
  } catch (error) {
    console.error('Error creating course MCQ test:', error);
    return res.status(400).json({ message: error.message || 'Failed to create MCQ test.' });
  }
};

exports.getCourseMcqTests = async (req, res) => {
  try {
    const filter = buildFilterFromQuery(req.query);
    const tests = await CourseMcqTest.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(tests.map((test) => sanitiseTestForResponse(test)));
  } catch (error) {
    console.error('Error fetching course MCQ tests:', error);
    return res.status(500).json({ message: 'Failed to fetch MCQ tests.', error: error.message });
  }
};

exports.getCourseMcqTestById = async (req, res) => {
  try {
    const includeAnswers = req.query.includeAnswers === 'true';
    const test = await CourseMcqTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'MCQ test not found.' });
    }
    return res.status(200).json(sanitiseTestForResponse(test, { includeAnswers }));
  } catch (error) {
    console.error('Error fetching course MCQ test by id:', error);
    return res.status(500).json({ message: 'Failed to fetch MCQ test.', error: error.message });
  }
};

exports.updateCourseMcqTest = async (req, res) => {
  try {
    const updates = {};
    if (req.body.title !== undefined) updates.title = toTrimmed(req.body.title) || '';
    if (req.body.description !== undefined) updates.description = toTrimmed(req.body.description) || '';
    if (req.body.courseName !== undefined) updates.courseName = toTrimmed(req.body.courseName) || '';
    if (req.body.courseCode !== undefined) updates.courseCode = toTrimmed(req.body.courseCode) || '';
    if (req.body.passPercentage !== undefined) {
      const pass = Number(req.body.passPercentage);
      if (!Number.isFinite(pass) || pass < 0 || pass > 100) {
        return res.status(400).json({ message: 'passPercentage must be between 0 and 100.' });
      }
      updates.passPercentage = pass;
    }
    if (req.body.durationMinutes !== undefined) {
      const duration = Number(req.body.durationMinutes);
      if (!Number.isFinite(duration) || duration < 0) {
        return res.status(400).json({ message: 'durationMinutes must be 0 or greater.' });
      }
      updates.durationMinutes = Math.floor(duration);
    }
    if (req.body.maxAttemptsPerStudent !== undefined) {
      const attempts = Number(req.body.maxAttemptsPerStudent);
      if (!Number.isFinite(attempts) || attempts < 0) {
        return res.status(400).json({ message: 'maxAttemptsPerStudent must be 0 or greater.' });
      }
      updates.maxAttemptsPerStudent = Math.floor(attempts);
    }
    if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
    if (req.body.metadata) {
      updates.metadata = {
        createdBy: toTrimmed(req.body.metadata.createdBy) || '',
        tags: Array.isArray(req.body.metadata.tags)
          ? req.body.metadata.tags.map((tag) => toTrimmed(tag)).filter(Boolean)
          : [],
      };
    }
    if (req.body.questions) {
      updates.questions = prepareQuestions(req.body.questions);
    }

    const updated = await CourseMcqTest.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ message: 'MCQ test not found.' });
    }
    return res.status(200).json(sanitiseTestForResponse(updated, { includeAnswers: true }));
  } catch (error) {
    console.error('Error updating course MCQ test:', error);
    return res.status(400).json({ message: error.message || 'Failed to update MCQ test.' });
  }
};

exports.deleteCourseMcqTest = async (req, res) => {
  try {
    const deleted = await CourseMcqTest.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'MCQ test not found.' });
    }
    return res.status(200).json({ message: 'MCQ test deleted successfully.' });
  } catch (error) {
    console.error('Error deleting course MCQ test:', error);
    return res.status(500).json({ message: 'Failed to delete MCQ test.', error: error.message });
  }
};

exports.toggleCourseMcqTestActiveState = async (req, res) => {
  try {
    const test = await CourseMcqTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'MCQ test not found.' });
    }
    test.isActive = req.body.isActive === undefined ? !test.isActive : Boolean(req.body.isActive);
    await test.save();
    return res.status(200).json({ id: test._id, isActive: test.isActive });
  } catch (error) {
    console.error('Error toggling MCQ test active state:', error);
    return res.status(500).json({ message: 'Failed to toggle MCQ test.', error: error.message });
  }
};

const mapQuestionsById = (questions = []) => {
  const map = new Map();
  questions.forEach((question) => {
    map.set(question._id.toString(), question);
  });
  return map;
};

const enforceAttemptLimit = async (testId, studentId, maxAttempts) => {
  if (!maxAttempts) return true;
  const count = await CourseMcqAttempt.countDocuments({ testId, studentId });
  if (count >= maxAttempts) {
    throw new Error('Maximum attempts exceeded for this test.');
  }
  return true;
};

exports.submitCourseMcqTest = async (req, res) => {
  try {
    const testId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: 'Invalid test id.' });
    }

    const test = await CourseMcqTest.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'MCQ test not found.' });
    }
    if (!test.isActive) {
      return res.status(400).json({ message: 'MCQ test is not active.' });
    }

    const studentId = toTrimmed(req.body.studentId);
    const studentName = toTrimmed(req.body.studentName);
    if (!studentId || !studentName) {
      return res.status(400).json({ message: 'studentId and studentName are required.' });
    }

    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    if (!answers.length) {
      return res.status(400).json({ message: 'answers array is required.' });
    }

    await enforceAttemptLimit(test._id, studentId, test.maxAttemptsPerStudent);

    const questionMap = mapQuestionsById(test.questions);
    let correctCount = 0;

    const responses = answers
      .map((answer) => {
        if (!answer) return null;
        const questionId = answer.questionId && answer.questionId.toString();
        if (!questionId || !questionMap.has(questionId)) {
          return null;
        }
        const question = questionMap.get(questionId);
        const selectedIndex = Number(answer.selectedOptionIndex);
        if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= question.options.length) {
          return null;
        }
        const isCorrect = selectedIndex === question.correctOptionIndex;
        if (isCorrect) correctCount += 1;
        return {
          questionId: question._id,
          selectedOptionIndex: selectedIndex,
          isCorrect,
          correctOptionIndex: question.correctOptionIndex,
        };
      })
      .filter(Boolean);

    if (responses.length !== test.questions.length) {
      return res.status(400).json({ message: 'All questions must be answered with valid option indexes.' });
    }

    const uniqueQuestionIds = new Set(responses.map((response) => response.questionId.toString()));
    if (uniqueQuestionIds.size !== test.questions.length) {
      return res.status(400).json({ message: 'Each question must be answered exactly once.' });
    }

    const totalQuestions = test.questions.length;
    const percentage = totalQuestions ? (correctCount / totalQuestions) * 100 : 0;
    const passPercentage = test.passPercentage || DEFAULT_PASS_PERCENTAGE;
    const passed = percentage >= passPercentage;

    const attempt = await CourseMcqAttempt.create({
      testId: test._id,
      studentId,
      studentName,
      batchName: toTrimmed(req.body.batchName) || '',
      courseName: test.courseName,
      startedAt: req.body.startedAt ? new Date(req.body.startedAt) : new Date(),
      submittedAt: new Date(),
      totalQuestions,
      totalCorrect: correctCount,
      percentage: Number(percentage.toFixed(2)),
      passPercentage,
      passed,
      responses,
      remarks: toTrimmed(req.body.remarks) || '',
    });

    return res.status(201).json({
      attemptId: attempt._id,
      passed,
      percentage: attempt.percentage,
      totalCorrect: attempt.totalCorrect,
      totalQuestions: attempt.totalQuestions,
      passPercentage: attempt.passPercentage,
      responses: attempt.responses,
    });
  } catch (error) {
    console.error('Error submitting course MCQ test:', error);
    return res.status(400).json({ message: error.message || 'Failed to submit MCQ test.' });
  }
};

exports.getCourseMcqAttempts = async (req, res) => {
  try {
    const { studentId, passed } = req.query;
    const filter = { testId: req.params.id };
    if (studentId) {
      filter.studentId = studentId;
    }
    if (passed === 'true') filter.passed = true;
    if (passed === 'false') filter.passed = false;

    const attempts = await CourseMcqAttempt.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(attempts);
  } catch (error) {
    console.error('Error fetching MCQ attempts:', error);
    return res.status(500).json({ message: 'Failed to fetch attempts.', error: error.message });
  }
};

exports.getCourseMcqAttemptById = async (req, res) => {
  try {
    const attempt = await CourseMcqAttempt.findById(req.params.attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' });
    }
    return res.status(200).json(attempt);
  } catch (error) {
    console.error('Error fetching MCQ attempt by id:', error);
    return res.status(500).json({ message: 'Failed to fetch attempt.', error: error.message });
  }
};
