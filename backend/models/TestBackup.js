const mongoose = require('mongoose');

const testBackupSchema = new mongoose.Schema({
    originalTestId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Test' },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    backupData: { type: Object, required: true },
    changes: { type: String },
    backupDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TestBackup', testBackupSchema);
