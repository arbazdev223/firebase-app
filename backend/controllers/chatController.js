const Chat = require('../models/Chat');

exports.createChat = async (req, res) => {
    try {
        const { is_group, participants, group_name, group_icon } = req.body;

        // Input validation
        if (!is_group || !participants || participants.length < 2) {
            return res.status(400).json({ message: 'Invalid input. A group must have at least two participants.' });
        }

        const newChat = await Chat.create({
            is_group,
            participants,
            group_name,
            group_icon: group_icon || null,
        });

        res.status(201).json(newChat);
    } catch (err) {
        res.status(500).json({ message: 'Error creating chat', error: err.message });
    }
};
