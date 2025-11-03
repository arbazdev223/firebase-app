const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for a single form field
const formFieldSchema = new Schema({
  cols: { type: Number, default: 6 }, 
  label: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['text', 'number', 'date', 'datetime-local', 'select', 'file', 'textarea', 'multi-select', 'hidden'], required: true },
  placeholder: { type: String, required: false },
  options: { type: [String], default: [] },  
  required: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  min: { type: Number },
  max: { type: Number },
  onFocusType: { type: String },
  category: { type: String },
});

const formSchema = new Schema({
  form_type: { type: String, required: true },
  fields: [formFieldSchema], 
});

const Form = mongoose.model('Form', formSchema);

module.exports = Form;
