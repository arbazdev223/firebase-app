const NoteReminder = require('../models/noteReminderModel');

// Get all notes and reminders with user details
exports.getAllNotesReminders = async (req, res) => {
    try {
        const notesReminders = await NoteReminder.find().populate('user', 'user thumb name user_code');
        res.status(200).json(notesReminders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new note or reminder
exports.createNoteReminder = async (req, res) => {
    try {
        const { user, title, description, reminderDate, isDaily, isFav, tag } = req.body;
        const noteReminder = new NoteReminder({ user, title, description, reminderDate, isDaily, isFav, tag });
        await noteReminder.save();
        res.status(201).json(noteReminder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update an existing note or reminder
exports.updateNoteReminder = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const updatedNoteReminder = await NoteReminder.findByIdAndUpdate(id, updatedData, { new: true });
        res.status(200).json(updatedNoteReminder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a note or reminder
exports.deleteNoteReminder = async (req, res) => {
    try {
        const { id } = req.params;
        await NoteReminder.findByIdAndDelete(id);
        res.status(200).json({ message: 'Note or Reminder deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
