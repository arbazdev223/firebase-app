const mongoose = require('mongoose');

const DemoSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Enqure' },
    counsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    course: { type: String, require: true },
    demoDate: { type: Date, require: true },
    demoStatus: { type: String, require: true },
    counsellorRemark: { type: String },
    facultyRemark: { type: String },
}, { timestamps: true });

const Demo = mongoose.model('Demo', DemoSchema);

module.exports = Demo;
