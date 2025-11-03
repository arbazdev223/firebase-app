const mongoose = require('mongoose');

const syncErrorSchema = new mongoose.Schema({
  source: { type: String },
  callId: { type: String },
  payload: { type: mongoose.Schema.Types.Mixed },
  error: { type: String },
  attempts: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('SyncError', syncErrorSchema);
