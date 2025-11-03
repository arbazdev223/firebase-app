const express = require('express');
const QuickInsertEntry = require('../models/QuickInsertEntry');
const Enqure = require('../models/Enqure');
const multer = require('multer');
const path = require('path');
const AWS = require('aws-sdk');
const fs = require('fs');

const router = express.Router();

// Multer config: uploads folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});
const upload = multer({ storage });

const s3 = new AWS.S3({
  endpoint: 'https://582328aa44fe3bcd4d90060e0a558eae.r2.cloudflarestorage.com',
  accessKeyId: '477949571b2baa26ff5b94195b93dd76',
  secretAccessKey: 'd42e9da877365aabdbd7b59c1e3a543cb20ce4a321801b249f8e29c51fb6a7c8',
  region: 'auto',
});
const BUCKET_NAME = 'lms';

const formatEntry = (entry) => {
  const counsellor = entry.counsellor;
  const replyTarget = entry.replyTo;
  return {
    _id: entry._id,
    entryType: entry.entryType,
    message: entry.message,
    summary: entry.summary,
    counsellorId: counsellor?._id ?? entry.counsellor,
    counsellorName: counsellor?.name ?? null,
    authorName: counsellor?.name ?? entry.metadata?.authorName ?? null,
    enquiry: entry.enquiry ?? null,
    metadata: entry.metadata ?? {},
    replyTo: replyTarget
      ? {
          _id: replyTarget._id,
          summary: replyTarget.summary,
          message: replyTarget.message,
          counsellorName: replyTarget.counsellor?.name ?? null,
        }
      : null,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    seenBy: entry.seenBy || [],
    edited: entry.edited || false, // <-- add edited flag
  };
};

router.get('/', async (req, res) => {
  try {
    // Pagination support
    let { before, limit } = req.query;
    limit = Math.min(Number(limit) || 20, 100);

    const query = {};
    if (before) {
      // Only fetch entries created before the given date
      query.createdAt = { $lt: new Date(before) };
    }

    const entries = await QuickInsertEntry.find(query)
      .sort({ createdAt: -1 }) // changed from 1 to -1 (newest first)
      .limit(limit)
      .populate('counsellor', 'name role')
      .populate({ path: 'replyTo', populate: { path: 'counsellor', select: 'name role' } });

    res.json(entries.map(formatEntry));
  } catch (error) {
    console.error('QuickInsert GET failed:', error);
    res.status(500).json({ message: 'Failed to fetch quick insert feed.' });
  }
});

router.post('/note', async (req, res) => {
  try {
    const { counsellorId, message, replyTo } = req.body;

    if (!counsellorId || !message?.trim()) {
      return res.status(400).json({ message: 'counsellorId and message are required.' });
    }

    let replyEntry = null;
    if (replyTo) {
      replyEntry = await QuickInsertEntry.findById(replyTo);
      if (!replyEntry) {
        return res.status(400).json({ message: 'Reply target not found.' });
      }
    }

    const entry = await QuickInsertEntry.create({
      entryType: 'note',
      counsellor: counsellorId,
      message: message.trim(),
      summary: message.trim(),
      metadata: {},
      replyTo: replyEntry?._id ?? null,
    });

    await entry.populate([
      { path: 'counsellor', select: 'name role' },
      { path: 'replyTo', populate: { path: 'counsellor', select: 'name role' } },
    ]);
    // Emit real-time event
    req.app.get('io')?.emit('quick-insert:new', formatEntry(entry));
    res.status(201).json(formatEntry(entry));
  } catch (error) {
    console.error('QuickInsert NOTE failed:', error);
    res.status(500).json({ message: 'Unable to save note.' });
  }
});

router.post('/enquiry', async (req, res) => {
  try {
    const { counsellorId, enquiry, replyTo } = req.body;

    if (!counsellorId || !enquiry) {
      return res.status(400).json({ message: 'counsellorId and enquiry payload are required.' });
    }

    const {
      source,
      studentMobile,
      studentName,
      location,
      courses = [],
      totalFees,
      response,
      remarks,
      leadStatus,
    } = enquiry;

    if (!source || !studentMobile || !studentName) {
      return res
        .status(400)
        .json({ message: 'source, studentMobile and studentName are required.' });
    }

    let replyEntry = null;
    if (replyTo) {
      replyEntry = await QuickInsertEntry.findById(replyTo);
      if (!replyEntry) {
        return res.status(400).json({ message: 'Reply target not found.' });
      }
    }

    // remarks can be string, array, or object, always store as array of objects with only string content for summary
    let remarksArr = [];
    let remarksSummary = '';
    if (Array.isArray(remarks)) {
      remarksArr = remarks.map((r) =>
        typeof r === 'string'
          ? { remarks: r, response: response || 'Follow Up', formType: 'quickInsert', user: counsellorId }
          : (typeof r === 'object' && r.remarks ? r : { remarks: JSON.stringify(r), response: response || 'Follow Up', formType: 'quickInsert', user: counsellorId })
      );
      remarksSummary = remarksArr.map(r => r.remarks).join(', ');
    } else if (remarks && typeof remarks === 'object') {
      // If remarks is an object, try to extract .remarks or stringify
      remarksArr = [remarks.remarks
        ? { ...remarks, response: response || 'Follow Up', formType: 'quickInsert', user: counsellorId }
        : { remarks: JSON.stringify(remarks), response: response || 'Follow Up', formType: 'quickInsert', user: counsellorId }
      ];
      remarksSummary = remarksArr[0].remarks;
    } else if (remarks) {
      remarksArr = [
        {
          remarks,
          response: response || 'Follow Up',
          formType: 'quickInsert',
          user: counsellorId,
        },
      ];
      remarksSummary = remarks;
    }

    const newEnquiry = await Enqure.create({
      source,
      counsellor: counsellorId,
      studentName,
      studentMobile,
      location: location || null,
      course: Array.isArray(courses) && courses.length ? courses : undefined,
      totalFees: totalFees || null,
      leadStatus: leadStatus || null,
      remarks: remarksArr,
    });

    const summary = [
      `🗂️ ${studentName}`,
      `Source: ${source}`,
      `Mobile: ${studentMobile}`,
      location ? `Location: ${location}` : null,
      courses?.length ? `Courses: ${courses.join(', ')}` : null,
      totalFees ? `Total Fees: ${totalFees}` : null,
      response ? `Response: ${response}` : null,
      remarksSummary ? `Remarks: ${remarksSummary}` : null,
      leadStatus ? `Lead Status: ${leadStatus}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const entry = await QuickInsertEntry.create({
      entryType: 'enquiry',
      counsellor: counsellorId,
      summary,
      enquiry: newEnquiry._id,
      metadata: {
        studentName,
        studentMobile,
        courses,
        leadStatus,
      },
      replyTo: replyEntry?._id ?? null,
    });

    await entry.populate([
      { path: 'counsellor', select: 'name role' },
      { path: 'replyTo', populate: { path: 'counsellor', select: 'name role' } },
    ]);
    // Emit real-time event
    req.app.get('io')?.emit('quick-insert:new', formatEntry(entry));
    res.status(201).json(formatEntry(entry));
  } catch (error) {
    console.error('QuickInsert ENQUIRY failed:', error);
    res.status(500).json({ message: 'Unable to save quick enquiry.' });
  }
});

// Edit a note
router.put('/note/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }
    const entry = await QuickInsertEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ message: 'Note not found.' });
    }
    entry.message = message.trim();
    entry.summary = message.trim();
    entry.updatedAt = new Date();
    entry.edited = true; // <-- set edited true on update
    await entry.save();
    await entry.populate([
      { path: 'counsellor', select: 'name role' },
      { path: 'replyTo', populate: { path: 'counsellor', select: 'name role' } },
    ]);
    req.app.get('io')?.emit('quick-insert:edit', formatEntry(entry));
    res.json(formatEntry(entry));
  } catch (error) {
    console.error('QuickInsert NOTE UPDATE failed:', error);
    res.status(500).json({ message: 'Unable to update note.' });
  }
});

// Delete a note
router.delete('/note/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await QuickInsertEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ message: 'Note not found.' });
    }
    await entry.deleteOne();
    req.app.get('io')?.emit('quick-insert:delete', id);
    res.json({ success: true });
  } catch (error) {
    console.error('QuickInsert NOTE DELETE failed:', error);
    res.status(500).json({ message: 'Unable to delete note.' });
  }
});

// Mark a quick insert entry as seen by a user
router.post('/seen/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const entry = await QuickInsertEntry.findById(id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    // Initialize seenBy if not present
    if (!Array.isArray(entry.seenBy)) entry.seenBy = [];

    // Only add if not already present
    if (!entry.seenBy.some(u => String(u._id || u) === String(userId))) {
      entry.seenBy.push({ _id: userId, name: userName || '' });
      await entry.save();
      // Emit real-time seen event to all clients
      req.app.get('io')?.emit('quick-insert:seen', { id, userId, userName });
    }

    await entry.populate([
      { path: 'counsellor', select: 'name role' },
      { path: 'replyTo', populate: { path: 'counsellor', select: 'name role' } },
    ]);
    res.json(formatEntry(entry));
  } catch (error) {
    console.error('QuickInsert SEEN failed:', error);
    res.status(500).json({ message: 'Unable to mark as seen.' });
  }
});

// Media upload endpoint (Cloudflare R2)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { counsellorId } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    if (!counsellorId) return res.status(400).json({ message: 'counsellorId required.' });

    // Determine media type
    let mediaType = 'file';
    if (req.file.mimetype.startsWith('image')) mediaType = 'image';
    else if (req.file.mimetype.startsWith('video')) mediaType = 'video';
    else if (req.file.mimetype.startsWith('audio')) mediaType = 'audio';

    // Upload to R2 bucket
    const fileContent = fs.readFileSync(req.file.path);
    const r2Key = `quick-insert/${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: fileContent,
      ContentType: req.file.mimetype,
    };

    const r2Result = await s3.upload(uploadParams).promise();

    // Construct public URL for Cloudflare R2 (replace with your public bucket URL if needed)
    const fileUrl = `https://imsdata.ifda.in/${r2Key}`;

    // Remove local file after upload
    fs.unlinkSync(req.file.path);

    // Save entry in QuickInsertEntry
    const entry = await QuickInsertEntry.create({
      entryType: mediaType,
      counsellor: counsellorId,
      summary: `${mediaType} uploaded`,
      mediaUrl: fileUrl, // <-- add this for mobile app
      mediaType,
      metadata: {
        mediaUrl: fileUrl,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        r2Key,
      },
    });

    await entry.populate([
      { path: 'counsellor', select: 'name role' }
    ]);
    // Emit real-time event
    req.app.get('io')?.emit('quick-insert:new', formatEntry(entry));
    res.status(201).json(formatEntry(entry));
  } catch (error) {
    console.error('QuickInsert UPLOAD failed:', error);
    res.status(500).json({ message: 'Unable to upload media.' });
  }
});

module.exports = router;
