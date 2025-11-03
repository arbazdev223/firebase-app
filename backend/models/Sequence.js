const mongoose = require('mongoose');

const sequenceSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

const Sequence = mongoose.model('Sequence', sequenceSchema);
module.exports = Sequence;
