const mongoose = require('mongoose');

const QuickInsertEntrySchema = new mongoose.Schema(
  {
    entryType: {
      type: String,
      enum: ['note', 'enquiry'],
      required: true,
    },
    counsellor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: { type: String },
    summary: { type: String },
    enquiry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enqure',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuickInsertEntry',
      default: null,
    },
    seenBy: [
      {
        _id: { type: String },
        name: { type: String, default: '' },
      },
    ],
    edited: { type: Boolean, default: false }, // <-- add edited field
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuickInsertEntry', QuickInsertEntrySchema);
