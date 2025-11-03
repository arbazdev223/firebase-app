const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  sender: {
    id: { type: String, required: true },      // JWT se aane wala id (student portal ka _id ya registration_number)
    registration_number: { type: String },      // Student ka registration_number (optional)
    name: { type: String, required: true },    // JWT se aane wala name
    email: { type: String, required: true },   // JWT se aane wala email
    role: { type: String, required: true }     // 'Student' ya 'Faculty' ya 'Admin'
  },
  chat: { type: Schema.Types.ObjectId, refPath: 'chatModel', required: true }, // group or user chat
  chatModel: { type: String, required: true, enum: ['Group', 'User'] },
  content: { type: String },
  file: { type: Schema.Types.ObjectId, ref: 'File' },
  pinned: { type: Boolean, default: false },
  reactions: [{ user: {
    id: { type: String, required: true },
    registration_number: { type: String }, // Add registration_number here
    name: { type: String },
    email: { type: String },
    role: { type: String }
  }, emoji: String }],
  replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
  delivered: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', MessageSchema);
