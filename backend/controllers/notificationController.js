const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // Ensure `req.user` is populated via middleware
        const notifications = await Notification.find({ user_id: userId });

        if (notifications.length === 0) {
            return res.status(200).json({ message: 'No notifications found.' });
        }

        res.status(200).json(notifications);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching notifications', error: err.message });
    }
};
