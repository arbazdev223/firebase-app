const FinalStudentFeedback = require('../models/FinalStudentFeedback');

const ALLOWED_RESPONSE_TYPES = new Set([
  'rating',
  'scale',
  'text',
  'longText',
  'boolean',
  'dropdown',
  'multiSelect',
]);

const LEGACY_SECTION_CONFIG = [
  {
    sourceKey: 'aboutCourse',
    key: 'about-course',
    title: 'About the Course',
    responseType: 'rating',
    questions: {
      goalsExplanation: 'The goals of the course were explained clearly.',
      topicsOrganization: 'The course topics were well-organized.',
      expectationAlignment: 'The course matched what I wanted to learn.',
      durationSuitability: 'The course duration was suitable.',
      theoryPracticeBalance: 'The course had a good mix of theory and practice.',
      studyMaterialUsefulness: 'The notes and study materials were useful.',
      industryUpdatedContent: 'The course content was updated with the latest industry needs.',
      assignmentHelpfulness: 'The assignments and exercises were helpful and interesting.',
    },
  },
  {
    sourceKey: 'aboutTrainer',
    key: 'about-trainer',
    title: 'About the Trainer',
    responseType: 'rating',
    questions: {
      subjectKnowledge: 'The trainer had good knowledge of the subject.',
      clarityOfExplanation: 'The trainer explained topics clearly and simply.',
      realLifeExamples: 'The trainer used real-life examples while teaching.',
      encouragedQuestions: 'The trainer encouraged us to ask questions.',
      personalAttention: 'The trainer gave personal attention when needed.',
      pacing: 'The trainer spoke and taught at a good pace.',
      feedbackProvision: 'The trainer gave feedback on our work or assignments.',
      overallSatisfaction: 'Overall, I am satisfied with the trainer’s teaching.',
    },
  },
  {
    sourceKey: 'practicalLearning',
    key: 'practical-learning',
    title: 'Practical Learning',
    responseType: 'rating',
    questions: {
      practiceSessions: 'I got enough practice sessions or lab time.',
      projectUsefulness: 'The projects or practical work were useful.',
      handsOnUnderstanding: 'The hands-on practice helped me understand better.',
      industryToolsLearning: 'I learned how to use industry tools or software.',
      problemSolvingImprovement: 'The course helped me improve problem-solving skills.',
      realWorkConfidence: 'I feel confident using what I learned in real work.',
    },
  },
  {
    sourceKey: 'instituteFacilities',
    key: 'institute-facilities',
    title: 'Institute Facilities & Support',
    responseType: 'rating',
    questions: {
      comfortableFacilities: 'The classrooms or labs were comfortable and clean.',
      technicalInfrastructure: 'Computers, internet, and software worked properly.',
      onlinePlatformAccess: 'The online platform (if used) was easy to access.',
      resourceAvailability: 'Study materials and resources were easy to get.',
      supportStaffHelpfulness: 'The admin and support staff were helpful and polite.',
      safeEnvironment: 'I felt safe and respected during my time at the institute.',
    },
  },
  {
    sourceKey: 'careerSupport',
    key: 'career-support',
    title: 'Career Help & Placement',
    responseType: 'rating',
    questions: {
      careerGuidance: 'I got proper career guidance from the institute.',
      jobUpdates: 'I received updates about job or internship opportunities.',
      resumeSessions: 'Resume and interview sessions were helpful.',
      placementCommunication: 'The placement team communicated clearly.',
      jobReadiness: 'The course helped me become more job-ready.',
      interviewConfidence: 'I feel more confident about attending interviews.',
    },
  },
  {
    sourceKey: 'onlineLearningExperience',
    key: 'online-learning',
    title: 'Online Learning Experience',
    responseType: 'rating',
    questions: {
      classManagement: 'Online classes were well-managed and interactive.',
      trainerEngagement: 'The trainer kept the online classes interesting.',
      materialSharing: 'Recordings or materials were shared after sessions.',
      communicationClarity: 'Communication through WhatsApp, email, or LMS was clear.',
    },
  },
  {
    sourceKey: 'administrationManagement',
    key: 'administration-management',
    title: 'Administration & Management',
    responseType: 'rating',
    questions: {
      admissionProcess: 'The admission process was smooth.',
      feeTransparency: 'The fee details and rules were clearly explained.',
      scheduleUpdates: 'The schedule and updates were shared on time.',
      managementProfessionalism: 'Overall, the institute management was professional.',
    },
  },
  {
    sourceKey: 'personalGrowth',
    key: 'personal-growth',
    title: 'Personal Growth',
    responseType: 'rating',
    questions: {
      confidenceImprovement: 'This course improved my confidence.',
      careerPreparedness: 'I feel more prepared for my career now.',
      teamworkSkills: 'I learned how to work with others and be a team player.',
      continuousLearningEncouragement: 'IFDA Institute encouraged me to keep learning new things.',
    },
  },
  {
    sourceKey: 'overallExperience',
    key: 'overall-experience',
    title: 'Overall Experience',
    questions: {
      overallSatisfaction: {
        prompt: 'Overall, I am satisfied with my learning experience at IFDA.',
        responseType: 'rating',
        scaleMin: 1,
        scaleMax: 5,
      },
      recommendationLikelihood: {
        prompt: 'How likely are you to recommend IFDA Institute to your friends?',
        responseType: 'scale',
        scaleMin: 0,
        scaleMax: 10,
      },
      favoritePart: {
        prompt: 'What did you like the most about your training?',
        responseType: 'longText',
      },
      improvementSuggestion: {
        prompt: 'What can IFDA improve for future students?',
        responseType: 'longText',
      },
    },
  },
];

const toSlug = (value, fallback) => {
  const base = (value || fallback || '').toString().trim().toLowerCase();
  const slug = base.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return slug || fallback || 'item';
};

const normaliseResponseType = (rawType = 'rating') => {
  const lower = rawType.toString().trim().toLowerCase();
  if (ALLOWED_RESPONSE_TYPES.has(lower)) {
    return lower;
  }
  if (['textarea', 'paragraph', 'long-text'].includes(lower)) return 'longText';
  if (['select', 'dropdown'].includes(lower)) return 'dropdown';
  if (['multi-select', 'multiselect'].includes(lower)) return 'multiSelect';
  if (['bool', 'toggle', 'checkbox'].includes(lower)) return 'boolean';
  if (['scale', 'rating', 'range'].includes(lower)) return 'rating';
  return 'text';
};

const normaliseOptions = (options) => {
  if (!Array.isArray(options)) return [];
  return options
    .map((item) => (item === undefined || item === null ? null : item.toString().trim()))
    .filter((item) => item);
};

const inferQuestionKey = (question, fallback) => {
  if (question.key) return toSlug(question.key, fallback);
  if (question.name) return toSlug(question.name, fallback);
  if (question.label) return toSlug(question.label, fallback);
  if (question.prompt) return toSlug(question.prompt, fallback);
  if (question.question) return toSlug(question.question, fallback);
  return fallback;
};

const normaliseQuestions = (sectionKey, questions = []) => {
  return questions
    .map((question, qIndex) => {
      if (!question) return null;
      const prompt = question.prompt || question.label || question.question || '';
      if (!prompt.trim()) return null;
      const key = inferQuestionKey(question, `${sectionKey}-q${qIndex + 1}`);
      const responseType = normaliseResponseType(question.responseType || question.type);
      const scaleMin = Number.isFinite(question.scaleMin)
        ? question.scaleMin
        : Array.isArray(question.scale)
        ? Number(question.scale[0])
        : Number.isFinite(question.scaleStart)
        ? Number(question.scaleStart)
        : undefined;
      const scaleMax = Number.isFinite(question.scaleMax)
        ? question.scaleMax
        : Array.isArray(question.scale)
        ? Number(question.scale[question.scale.length - 1])
        : Number.isFinite(question.scaleEnd)
        ? Number(question.scaleEnd)
        : undefined;

      const base = {
        key,
        prompt: prompt.trim(),
        responseType,
        isRequired: question.isRequired === undefined ? true : Boolean(question.isRequired),
        options: normaliseOptions(question.options),
        response:
          question.response !== undefined
            ? question.response
            : question.answer !== undefined
            ? question.answer
            : null,
      };

      if (responseType === 'rating' || responseType === 'scale') {
        if (Number.isFinite(scaleMin)) base.scaleMin = scaleMin;
        if (Number.isFinite(scaleMax)) base.scaleMax = scaleMax;
      }

      return base;
    })
    .filter(Boolean);
};

const normaliseSections = (sections = []) => {
  return sections
    .map((section, index) => {
      if (!section) return null;
      const title = (section.title || section.name || '').trim();
      if (!title) return null;
      const key = toSlug(section.key || title, `section-${index + 1}`);
      const normalizedQuestions = normaliseQuestions(key, section.questions);
      if (!normalizedQuestions.length) return null;
      return {
        key,
        title,
        description: (section.description || '').trim(),
        order: Number.isFinite(section.order) ? section.order : index,
        questions: normalizedQuestions,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
};

const convertLegacyPayloadToSections = (payload = {}) => {
  const sections = [];
  LEGACY_SECTION_CONFIG.forEach((config, idx) => {
    const existing = payload[config.sourceKey];
    if (!existing) return;

    const questionsArray = [];
    Object.entries(config.questions).forEach(([questionKey, questionValue], qIndex) => {
      const isStructured = typeof questionValue === 'object' && questionValue !== null;
      const prompt = isStructured ? questionValue.prompt : questionValue;
      const responseType = isStructured ? questionValue.responseType : config.responseType || 'rating';
      const scaleMin = isStructured && questionValue.scaleMin !== undefined ? questionValue.scaleMin : undefined;
      const scaleMax = isStructured && questionValue.scaleMax !== undefined ? questionValue.scaleMax : undefined;
      const response = existing[questionKey];

      questionsArray.push({
        key: questionKey,
        prompt,
        responseType,
        scaleMin,
        scaleMax,
        response: response !== undefined ? response : responseType === 'longText' ? '' : null,
      });
    });

    if (!questionsArray.length) return;

    sections.push({
      key: config.key,
      title: config.title,
      order: idx,
      questions: questionsArray,
    });
  });

  return sections.length ? normaliseSections(sections) : [];
};

const resolveSections = (payload = {}) => {
  if (Array.isArray(payload.sections) && payload.sections.length) {
    const directSections = normaliseSections(payload.sections);
    if (directSections.length) return directSections;
  }

  const legacySections = convertLegacyPayloadToSections(payload);
  if (legacySections.length) return legacySections;

  return [];
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toTrimmedString = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.toString().trim();
  return trimmed || undefined;
};

const extractBasicDetails = (payload = {}, { allowPartial = false } = {}) => {
  const source = payload.basicDetails || payload;
  const courseDurationValue = source.courseDuration;
  const feedbackDate = parseDate(source.feedbackDate);

  const details = {
    studentId: toTrimmedString(source.studentId),
    studentName: toTrimmedString(source.studentName),
    courseName: toTrimmedString(source.courseName),
    trainerName: toTrimmedString(source.trainerName),
    batchTiming: toTrimmedString(source.batchTiming),
    learningMode: toTrimmedString(source.learningMode),
    courseDuration:
      courseDurationValue === undefined && !allowPartial
        ? ''
        : toTrimmedString(courseDurationValue),
    feedbackDate: feedbackDate || (allowPartial ? undefined : new Date()),
  };

  const missing = Object.entries(details)
    .filter(([key, value]) => {
      if (key === 'courseDuration') return false;
      if (key === 'feedbackDate') return !value;
      return !value && !allowPartial;
    })
    .map(([key]) => key);

  return { details, missing };
};

const buildMetadata = (payload = {}, req = {}) => {
  const meta = payload.metadata || {};
  const templateVersion = payload.templateVersion || meta.templateVersion || '1.0.0';
  const submittedBy = meta.submittedBy || payload.submittedBy || (req.user && (req.user.id || req.user._id || req.user.email)) || '';

  return {
    templateVersion: templateVersion.toString().trim(),
    submittedBy: submittedBy.toString().trim(),
  };
};

exports.createFinalStudentFeedback = async (req, res) => {
  try {
    const sections = resolveSections(req.body);
    if (!sections.length) {
      return res.status(400).json({ message: 'At least one section with questions is required.' });
    }

    const { details, missing } = extractBasicDetails(req.body);
    if (missing.length) {
      return res.status(400).json({ message: `Missing required basic details: ${missing.join(', ')}` });
    }

    const feedback = await FinalStudentFeedback.create({
      basicDetails: details,
      sections,
      metadata: buildMetadata(req.body, req),
    });

    return res.status(201).json(feedback);
  } catch (error) {
    console.error('Error creating final student feedback:', error);
    return res.status(500).json({ message: 'Failed to create feedback', error: error.message });
  }
};

exports.getFinalStudentFeedbacks = async (req, res) => {
  try {
    const { studentId, trainerName, courseName } = req.query;
    const filter = {};
    if (studentId) filter['basicDetails.studentId'] = studentId;
    if (trainerName) filter['basicDetails.trainerName'] = trainerName;
    if (courseName) filter['basicDetails.courseName'] = courseName;

    const feedbacks = await FinalStudentFeedback.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(feedbacks);
  } catch (error) {
    console.error('Error fetching final student feedback list:', error);
    return res.status(500).json({ message: 'Failed to fetch feedback records', error: error.message });
  }
};

exports.getFinalStudentFeedbackById = async (req, res) => {
  try {
    const feedback = await FinalStudentFeedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback record not found' });
    }
    return res.status(200).json(feedback);
  } catch (error) {
    console.error('Error fetching final student feedback by id:', error);
    return res.status(500).json({ message: 'Failed to fetch feedback', error: error.message });
  }
};

exports.updateFinalStudentFeedback = async (req, res) => {
  try {
    const updatePayload = {};

    if (req.body.basicDetails) {
      const { details, missing } = extractBasicDetails({ basicDetails: req.body.basicDetails }, { allowPartial: true });
      if (missing.length && !req.body.allowMissingBasicDetails) {
        return res.status(400).json({ message: `Missing required basic details: ${missing.join(', ')}` });
      }
      updatePayload['basicDetails'] = {
        ...Object.fromEntries(
          Object.entries(details).filter(([key, value]) => value !== undefined && value !== null)
        ),
      };
    }

    if (req.body.sections) {
      const sections = resolveSections({ sections: req.body.sections });
      if (!sections.length) {
        return res.status(400).json({ message: 'At least one valid section with questions is required.' });
      }
      updatePayload.sections = sections;
    }

    if (req.body.metadata || req.body.templateVersion || req.body.submittedBy) {
      updatePayload.metadata = buildMetadata(req.body, req);
    }

    if (!Object.keys(updatePayload).length) {
      return res.status(400).json({ message: 'No valid fields supplied for update.' });
    }

    const updatedFeedback = await FinalStudentFeedback.findByIdAndUpdate(
      req.params.id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!updatedFeedback) {
      return res.status(404).json({ message: 'Feedback record not found' });
    }

    return res.status(200).json(updatedFeedback);
  } catch (error) {
    console.error('Error updating final student feedback:', error);
    return res.status(500).json({ message: 'Failed to update feedback', error: error.message });
  }
};

exports.deleteFinalStudentFeedback = async (req, res) => {
  try {
    const deletedFeedback = await FinalStudentFeedback.findByIdAndDelete(req.params.id);
    if (!deletedFeedback) {
      return res.status(404).json({ message: 'Feedback record not found' });
    }
    return res.status(200).json({ message: 'Feedback record deleted successfully' });
  } catch (error) {
    console.error('Error deleting final student feedback:', error);
    return res.status(500).json({ message: 'Failed to delete feedback', error: error.message });
  }
};
