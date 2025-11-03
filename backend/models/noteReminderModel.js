const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noteReminderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the User schema
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    reminderDate: {
        type: Date,
        default: null,
    },
    isDaily: {
        type: Boolean,
        default: false,
    },
    isFav: {
        type: Boolean,
        default: false,
    },
    tag: {
        type: String,
        default: '',
        trim: true,
    },
}, { timestamps: true });

const NoteReminder = mongoose.model('NoteReminder', noteReminderSchema);

module.exports = NoteReminder;
