const mongoose = require('mongoose');

const VariableSchema = new mongoose.Schema({
  name: String,
  mediaUrl: String
});

const ButtonSchema = new mongoose.Schema({
  type: String,
  text: String,
  url: String,
  variables: [VariableSchema]
});

const ComponentSchema = new mongoose.Schema({
  type: String,
  format: String,
  text: String,
  variables: [VariableSchema],
  buttons: [ButtonSchema]
});

const TemplateSchema = new mongoose.Schema({
  id: Number,
  name: String,
  language: String,
  category: String,
  components: [ComponentSchema],
  status: String,
  rejectedReason: String,
  createdBy: String,
  wabaPhoneNumber: String
});

module.exports = mongoose.model('Template', TemplateSchema);
