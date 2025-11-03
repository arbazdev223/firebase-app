const Ticket = require('../models/ticketModel');
const axios = require('axios');
const User = require('../models/User');

// Create a new ticket
exports.createTicket = async (req, res) => {
    try {
        const ticketData = req.body;
        const ticket = new Ticket(ticketData);
        await ticket.save();
        res.status(201).json({ message: 'Ticket created successfully', ticket });
    } catch (error) {
        res.status(400).json({ message: 'Failed to create ticket', error: error.message });
    }
};

exports.getAllTickets = async (req, res) => {
    try {
      const tickets = await Ticket.find(); // Fetch all tickets
      
      // Loop through each ticket to populate user name based on userType
      const updatedTickets = await Promise.all(
        tickets.map(async (ticket) => {
          if (ticket.userType === 'Student') {
            // Fetch student name from the external API (students API)
            try {
              const response = await axios.get(`https://lms.ifda.in/api/v1/students/${ticket.userId}`);
              console.log('Student data response:', response.data.student);  // Log the student data
              if (response.data.student && response.data.student._id) {
                ticket.userId = response.data.student.student_name;  // Assuming response contains a 'name' field for the student
              } else {
                ticket.userId = 'Unknown';  // Fallback if student data does not have a 'name' field
              }
            } catch (err) {
              console.error(`Error fetching student name for userId ${ticket.userId}:`, err);
              ticket.userId = 'Unknown';  // Fallback if student data cannot be fetched
            }
          } else if (ticket.userType === 'Staff') {
            // Fetch staff name from the User model in the database
            try {
              const staff = await User.findById(ticket.userId);
              console.log('Staff data found:', staff);  // Log the staff data
              if (staff) {
                ticket.userId = staff.name;  // Assuming staff data contains a 'name' field
              } else {
                ticket.userId = 'Unknown';  // Fallback if staff data is not found
              }
            } catch (err) {
              console.error(`Error fetching staff name for userId ${ticket.userId}:`, err);
              ticket.staffName = 'Unknown';  // Fallback if there is an error fetching staff data
            }
          } else {
            // Handle case for any unrecognized userType
            ticket.userName = 'Unknown';  // Provide a fallback name if the userType doesn't match expected values
          }
          return ticket;  // Return the updated ticket
        })
      );
  
      res.status(200).json(updatedTickets);  // Send the modified tickets data
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      res.status(500).json({ message: 'Failed to fetch tickets', error: error.message });
    }
  };

  // Get a ticket by ID
exports.getTicketById = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch ticket', error: error.message });
    }
};

// Update a ticket by ID
exports.updateTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const updatedData = req.body;

        const ticket = await Ticket.findByIdAndUpdate(ticketId, updatedData, { new: true });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.status(200).json({ message: 'Ticket updated successfully', ticket });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update ticket', error: error.message });
    }
};

// Delete a ticket by ID
exports.deleteTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;

        const ticket = await Ticket.findByIdAndDelete(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.status(200).json({ message: 'Ticket deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete ticket', error: error.message });
    }
};
