const Absent = require('../models/AbsentStudent');

// Create an absent record
const createAbsentRecord = async (req, res) => {
    const { registration_number, faculty_name, comment } = req.body;

    if (!registration_number || !faculty_name) {
        return res.status(400).json({ message: 'Registration number and faculty name are required.' });
    }

    try {
        const absentRecord = new Absent({
            registration_number,
            faculty_name,
            comment: comment || "", // Default empty if not provided
        });

        await absentRecord.save();
        res.status(201).json({
            message: 'Absent record created successfully.',
            data: absentRecord,
        });
    } catch (error) {
        console.error("Error creating absent record:", error);
        res.status(500).json({ message: 'Error creating absent record.', error });
    }
};

// Bulk Insert for Multiple Records
const bulkAssign = async (req, res) => {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ message: 'Invalid input. Provide an array of students.' });
    }

    // Validate student entries
    for (const student of students) {
        if (!student.registration_number) {
            return res.status(400).json({ message: 'Each student must have a registration_number.' });
        }
    }

    try {
        const operations = students.map(student => ({
            updateOne: {
                filter: {
                    registration_number: student.registration_number
                },
                update: { $set: student },
                upsert: true
            }
        }));

        const result = await Absent.bulkWrite(operations);

        res.status(200).json({
            message: 'Students assigned/updated successfully.',
            result
        });
    } catch (error) {
        console.error("Error assigning students:", error);
        res.status(500).json({ message: 'Error assigning students.', error: error.message });
    }
};


// Get all absent records
const getAllAbsentRecords = async (req, res) => {
    try {
        const records = await Absent.find();
        res.status(200).json({ message: 'All absent records retrieved.', data: records });
    } catch (error) {
        console.error("Error retrieving absent records:", error);
        res.status(500).json({ message: 'Error retrieving absent records.', error });
    }
};

// Get absent records filtered by registration number and faculty name
const getAbsentRecordsByFacultyAndRegistration = async (req, res) => {
    const { registration_number, faculty_name } = req.query;

    if (!registration_number && !faculty_name) {
        return res.status(400).json({ message: 'Provide at least one filter: registration number or faculty name.' });
    }

    try {
        const filter = {};
        if (registration_number) filter.registration_number = registration_number;
        if (faculty_name) filter.faculty_name = faculty_name;

        const filteredRecords = await Absent.find(filter);
        res.status(200).json({ message: 'Filtered absent records retrieved.', data: filteredRecords });
    } catch (error) {
        console.error("Error filtering absent records:", error);
        res.status(500).json({ message: 'Error filtering absent records.', error });
    }
};

// Update an absent record and append comments to the array
const updateAbsentRecord = async (req, res) => {
    const { id } = req.params;
    let { comment, status } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'Absent record ID is required for update.' });
    }

    try {
        const existingRecord = await Absent.findById(id);

        if (!existingRecord) {
            return res.status(404).json({ message: 'Absent record not found.' });
        }

        // Ensure `comment` is an array before updating
        if (comment) {
            if (!Array.isArray(existingRecord.comment)) {
                existingRecord.comment = []; // Initialize if not an array
            }

            if (Array.isArray(comment)) {
                existingRecord.comment = [...existingRecord.comment, ...comment];
            } else {
                existingRecord.comment.push(comment);
            }
        }

        if (status) existingRecord.status = status;

        await existingRecord.save();

        res.status(200).json({
            message: 'Absent record updated successfully.',
            data: existingRecord,
        });
    } catch (error) {
        console.error("Error updating absent record:", error);
        res.status(500).json({ message: 'Error updating absent record.', error });
    }
};


module.exports = {
    createAbsentRecord,
    bulkAssign,
    getAllAbsentRecords,
    getAbsentRecordsByFacultyAndRegistration,
    updateAbsentRecord,
};
