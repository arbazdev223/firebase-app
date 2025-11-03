const express = require('express');
const router = express.Router();
const noteReminderController = require('../controllers/noteReminderController');

// Routes
router.get('/', noteReminderController.getAllNotesReminders);
router.post('/', noteReminderController.createNoteReminder);
router.put('/:id', noteReminderController.updateNoteReminder);
router.delete('/:id', noteReminderController.deleteNoteReminder);

module.exports = router;
