const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: false, default: null },
  s3Key: {
    type: String,
    required: true
  },
  s3Url: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date,
    default: function() {
      // Auto-delete after 7 days
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for auto-expiry cleanup
fileSchema.index({ expiryDate: 1 });
fileSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('File', fileSchema); 