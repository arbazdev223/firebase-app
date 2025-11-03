const MeetingRemark = require('../models/MeetingRemark'); // Import the MeetingRemark model
const User = require('../models/User'); // Import the User model (for validation or population)

// Controller to create a new meeting remark
exports.createMeetingRemark = async (req, res) => {
    try {
      const { selectedTeams, selectedMembers, stars, editorContent } = req.body;
  
      // Ensure valid input data (could be improved further)
      if (!Array.isArray(selectedTeams) || selectedTeams.length === 0) {
        return res.status(400).json({ message: 'At least one team must be selected.' });
      }
  
      if (!Array.isArray(selectedMembers) || selectedMembers.length === 0) {
        return res.status(400).json({ message: 'At least one member must be selected.' });
      }
  
      // Create the new meeting remark document
      const newMeetingRemark = new MeetingRemark({
        selectedTeams,
        selectedMembers,
        stars,
        editorContent,
      });
  
      // Save the new meeting remark to the database
      await newMeetingRemark.save();
  
      // Send success response
      res.status(201).json({
        message: 'Meeting Remark created successfully',
        meetingRemark: newMeetingRemark,
      });
    } catch (error) {
      console.error('Error creating meeting remark:', error); // Detailed error logging
      res.status(500).json({
        message: 'An error occurred while creating the meeting remark.',
        error: error.message, // Send the error message in the response for debugging purposes
      });
    }
  };
  
// Controller to get all meeting remarks
exports.getAllMeetingRemarks = async (req, res) => {
  try {
    const meetingRemarks = await MeetingRemark.find()
      .populate('selectedMembers') // Populate user data for selected members
      .exec();

    res.status(200).json(meetingRemarks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching meeting remarks.' });
  }
};

// Controller to get a single meeting remark by ID
exports.getMeetingRemarkById = async (req, res) => {
  try {
    const { id } = req.params;

    const meetingRemark = await MeetingRemark.findById(id)
      .populate('selectedMembers') // Populate user data for selected members
      .exec();

    if (!meetingRemark) {
      return res.status(404).json({ message: 'Meeting Remark not found.' });
    }

    res.status(200).json(meetingRemark);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching the meeting remark.' });
  }
};
