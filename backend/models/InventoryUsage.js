// models/InventoryUsage.js
const mongoose = require('mongoose');
const Item = require('./Item');  // Reference Item model

const InventoryUsageSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  quantityUsed: { type: Number, required: true },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lab: { type: String, required: true },
  branch: { type: String, required: true },
  purpose: { type: String, required: true },
  remainingStock: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('InventoryUsage', InventoryUsageSchema);
