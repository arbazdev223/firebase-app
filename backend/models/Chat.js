const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    chat_id: { type: mongoose.Schema.Types.Mixed },
    is_group: { type: Boolean, default: false },
    participants: [{ type: mongoose.Schema.Types.Mixed }],
    group_name: { type: String },
    group_icon: { type: String },
    lastMessage: { type: String },
    lastMessageTime: { type: Date },
}, { timestamps: true });

const Chat = mongoose.model('Chat', ChatSchema);

module.exports = Chat;
