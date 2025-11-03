const mongoose = require('mongoose');

// Combined Schema for ProblemDetails and DropdownOptions
const ticketSchema = new mongoose.Schema({
    userId: {
        type: String,  // Reference to the user
        required: true
    },
    registration_number: {
        type: String,
    },
    userType: {
        type: String,
        required: true,
        enum: ['Student','Staff']
    },
    IssuesTypes: [
        {
            type: String,
            required: true,
        },
    ],
    Requirement: [
        {
            type: String,
        },
    ],
    DiscussSomeone: [
        {
            type: String,
        },
    ],
    Branch: {
        type: String,
        required: true,
    },
    Status: {
        type: String,
    },
    problemDetails: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
    }
}, { timestamps: true });

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
