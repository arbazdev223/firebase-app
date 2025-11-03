// models/Item.js
const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    required: true, 
    trim: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  unit: { 
    type: String, 
    required: true, 
    enum: ['Piece', 'Box', 'Kg', 'Liter', 'Meter', 'Set'] 
  },
  price: { 
    type: Number, 
    required: true 
  },
  currentStock: { 
    type: Number, 
    default: 0, 
    required: true 
  },
  reorderLevel: { 
    type: Number, 
    default: 0 
  },
  status: { 
    type: String, 
    enum: ['Available', 'Out of Stock', 'Discontinued'], 
    default: 'Available' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Item', ItemSchema);
