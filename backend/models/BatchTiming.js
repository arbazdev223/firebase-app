const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  fromTime: String,
  toTime: String,
  slotType: String,
  moduleName: String,
  frequency: String,
  Branch: String,
  class_mode: String,
  days: String
});

const batchTimingSchema = new mongoose.Schema({
  userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    required: true
  },
  slots: [slotSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('BatchTiming', batchTimingSchema);
