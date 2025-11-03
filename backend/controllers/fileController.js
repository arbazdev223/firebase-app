const File = require('../models/File');
const Message = require('../models/Message');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure R2 bucket (using AWS SDK) - Same as authController.js
const s3 = new AWS.S3({
    endpoint: 'https://582328aa44fe3bcd4d90060e0a558eae.r2.cloudflarestorage.com',
    accessKeyId: '477949571b2baa26ff5b94195b93dd76',
    secretAccessKey: 'd42e9da877365aabdbd7b59c1e3a543cb20ce4a321801b249f8e29c51fb6a7c8',
    region: 'auto',
});

const BUCKET_NAME = 'lms';

// Upload file
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { messageId, groupId } = req.body;
    const userId = (req.user && (req.user.userId || req.user.id)) || req.body.userId || null;
    // Fix: If groupId is blank, set to undefined
    const group = groupId && groupId.length > 0 ? groupId : undefined;

    // Upload to S3 like authController.js
    const fileKey = `chat-files/${uuidv4()}_${req.file.originalname}`;
    const uploadResult = await s3.upload({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
    }).promise();

    const fileUrl = `${process.env.AWS_URL || 'https://582328aa44fe3bcd4d90060e0a558eae.r2.cloudflarestorage.com/'}${fileKey}`;

    // Create file record
    const file = new File({
      filename: fileKey,
      originalName: req.file.originalname,
      path: fileUrl,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: userId, // can be null if no auth
      message: messageId,
      group: group, // will be undefined if blank
      s3Key: fileKey,
      s3Url: fileUrl
    });

    await file.save();

    // If messageId is provided, update the message with file reference
    if (messageId) {
      await Message.findByIdAndUpdate(messageId, {
        file: file._id,
        hasFile: true
      });
    }

    res.status(200).json({
      success: true,
      file: {
        id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        s3Url: file.s3Url,
        uploadedBy: file.uploadedBy,
        createdAt: file.createdAt
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message, stack: error.stack });
  }
};

// Get file download URL
const getFileDownloadUrl = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findOne({ _id: fileId, isDeleted: false });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Generate signed URL using AWS SDK
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: BUCKET_NAME,
      Key: file.s3Key,
      Expires: 3600 // 1 hour expiry
    });

    res.json({
      success: true,
      downloadUrl: signedUrl,
      file: {
        id: file._id,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType
      }
    });
  } catch (error) {
    console.error('Get download URL error:', error);
    res.status(500).json({ message: 'Error getting download URL' });
  }
};

// Get files for a group
const getGroupFiles = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const files = await File.find({
      group: groupId,
      isDeleted: false
    })
    .populate('uploadedBy', 'name email')
    .populate('message', 'content createdAt')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await File.countDocuments({
      group: groupId,
      isDeleted: false
    });

    res.json({
      success: true,
      files: files.map(file => ({
        id: file._id,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        s3Url: file.s3Url,
        uploadedBy: file.uploadedBy,
        message: file.message,
        createdAt: file.createdAt
      })),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get group files error:', error);
    res.status(500).json({ message: 'Error fetching group files' });
  }
};

// Delete file (soft delete)
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user is the uploader or admin
    if (file.uploadedBy.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this file' });
    }

    // Soft delete
    file.isDeleted = true;
    await file.save();

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Error deleting file' });
  }
};

// Cleanup expired files (cron job)
const cleanupExpiredFiles = async () => {
  try {
    const expiredFiles = await File.find({
      expiryDate: { $lt: new Date() },
      isDeleted: false
    });

    for (const file of expiredFiles) {
      // Delete from S3 using AWS SDK
      try {
        await s3.deleteObject({
          Bucket: BUCKET_NAME,
          Key: file.s3Key
        }).promise();
      } catch (s3Error) {
        console.error('S3 delete error:', s3Error);
      }
      
      // Mark as deleted in database
      file.isDeleted = true;
      await file.save();
    }

    console.log(`Cleaned up ${expiredFiles.length} expired files`);
  } catch (error) {
    console.error('Cleanup expired files error:', error);
  }
};

module.exports = {
  uploadFile,
  getFileDownloadUrl,
  getGroupFiles,
  deleteFile,
  cleanupExpiredFiles
}; 