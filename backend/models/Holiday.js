const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
    holidayName: {
        type: String,
        required: true,
        trim: true,
    },
    holidayType: {
        type: String,
        required: true,
        enum: ["One Day Holiday", "Long Holiday"],
    },
    date: {
        type: Date,
        required: function () {
            return this.holidayType === "One Day Holiday";
        },
    },
    from: {
        type: Date,
        required: function () {
            return this.holidayType === "Long Holiday";
        },
    },
    to: {
        type: Date,
        required: function () {
            return this.holidayType === "Long Holiday";
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// ✅ Prevent Overwrite Error
module.exports = mongoose.models.Holiday || mongoose.model("Holiday", holidaySchema);
