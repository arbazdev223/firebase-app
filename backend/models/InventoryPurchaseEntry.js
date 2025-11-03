// models/InventoryPurchaseEntry.js
const mongoose = require('mongoose');
const Item = require('./Item');  // Reference Item model

const InventoryPurchaseEntrySchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['Received', 'Pending'], 
    default: 'Pending' 
  }
}, { timestamps: true });

module.exports = mongoose.model('InventoryPurchaseEntry', InventoryPurchaseEntrySchema);
