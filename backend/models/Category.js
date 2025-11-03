const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema(
  {
    category: {
      type: String, 
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

const Category = mongoose.model('Category', CategorySchema);
module.exports = Category;
