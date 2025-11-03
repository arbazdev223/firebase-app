const mongoose = require('mongoose');

const myOperatorCallSchema = new mongoose.Schema({
  callId: { type: String, index: true },
  timestamp: { type: Date, index: true },
  from: { type: String, index: true },
  to: { type: String, index: true },
  direction: { type: String },
  // duration in seconds
  duration: { type: Number },
  // normalized receiver/remark fields
  receiver_name: { type: String, index: true },
  remark: { type: String },
  remark_date: { type: Date, index: true },
  status: { type: String },
  extension: { type: String },
  recording_url: { type: String },
  recording: { type: String },
  recordings: { type: Array },
  agent: { type: String },
  raw: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('MyOperatorCall', myOperatorCallSchema);
