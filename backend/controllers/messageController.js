const Message = require('../models/Message');
const Notification = require('../models/Notification');
const File = require('../models/File');

exports.sendMessage = async (req, res) => {
    try {
        const { chat, chatModel, content, fileId, replyTo } = req.body;
        const user = req.user;
        const sender = {
            id: user.id || user._id,
            registration_number: user.registration_number,
            name: user.name,
            email: user.email,
            role: user.role
        };

        if (!chat || !chatModel || (!content && !fileId)) {
            return res.status(400).json({ 
                message: 'Missing required fields: chat, chatModel, and either content or fileId.' 
            });
        }

        // Validate chatModel
        if (!['Group', 'User'].includes(chatModel)) {
            return res.status(400).json({ message: 'Invalid chatModel. Must be "Group" or "User".' });
        }

        // Create message
        const messageData = {
            sender,
            chat,
            chatModel,
            content: content || '',
            replyTo
        };

        // If fileId is provided, link the file
        if (fileId) {
            const file = await File.findById(fileId);
            if (!file) {
                return res.status(404).json({ message: 'File not found' });
            }
            messageData.file = fileId;
        }

        const message = await Message.create(messageData);

        // No populate needed, sender is embedded
        // Update or create a notification (for user chats only)
        if (chatModel === 'User') {
            await Notification.findOneAndUpdate(
                { chat_id: chat, user_id: { $ne: sender.id } },
                { $set: { last_message: content || 'File shared' }, $inc: { unread_count: 1 } },
                { upsert: true, new: true }
            );
        }

        res.status(201).json({
            success: true,
            message: {
                id: message._id,
                sender: message.sender,
                chat: message.chat,
                chatModel: message.chatModel,
                content: message.content,
                file: message.file,
                replyTo: message.replyTo,
                pinned: message.pinned,
                reactions: message.reactions,
                delivered: message.delivered,
                read: message.read,
                createdAt: message.createdAt
            }
        });
    } catch (err) {
        console.error('Send message error:', err);
        res.status(500).json({ message: 'Error sending message', error: err.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { chat, chatModel, page = 1, limit = 50 } = req.query;

        if (!chat || !chatModel) {
            return res.status(400).json({ message: 'Missing required fields: chat and chatModel.' });
        }

        const messages = await Message.find({
            chat,
            chatModel
        })
        .populate('file')
        .populate('replyTo')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        const total = await Message.countDocuments({ chat, chatModel });

        res.json({
            success: true,
            messages: messages.reverse(), // Show oldest first
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (err) {
        console.error('Get messages error:', err);
        res.status(500).json({ message: 'Error fetching messages', error: err.message });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id || req.user._id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if user is the sender or admin
        if (message.sender.id !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }

        await Message.findByIdAndDelete(messageId);

        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (err) {
        console.error('Delete message error:', err);
        res.status(500).json({ message: 'Error deleting message', error: err.message });
    }
};

exports.pinMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { pinned } = req.body;

        const message = await Message.findByIdAndUpdate(
            messageId,
            { pinned },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.json({
            success: true,
            message: {
                id: message._id,
                pinned: message.pinned,
                content: message.content,
                sender: message.sender
            }
        });
    } catch (err) {
        console.error('Pin message error:', err);
        res.status(500).json({ message: 'Error pinning message', error: err.message });
    }
};
