const Holiday = require("../models/Holiday");

const addHoliday = async (req, res) => {
    try {
        const { holidayName, holidayType, date, from, to } = req.body;

        if (!holidayName || !holidayType) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Validate One Day Holiday
        if (holidayType === "One Day Holiday" && !date) {
            return res.status(400).json({ message: "Date is required for a one-day holiday." });
        }

        // Validate Long Holiday
        if (holidayType === "Long Holiday" && (!from || !to)) {
            return res.status(400).json({ message: "Both 'from' and 'to' dates are required for a long holiday." });
        }

        const newHoliday = new Holiday({ holidayName, holidayType, date, from, to });
        await newHoliday.save();

        res.status(201).json({ message: "Holiday added successfully!", holiday: newHoliday });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find().sort({ createdAt: -1 });
        res.status(200).json(holidays);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Delete a holiday
// @route   DELETE /api/holidays/:id
// @access  Public
const deleteHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.findById(req.params.id);

        if (!holiday) {
            return res.status(404).json({ message: "Holiday not found" });
        }

        await holiday.deleteOne();
        res.status(200).json({ message: "Holiday deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = { addHoliday, getHolidays, deleteHoliday };
