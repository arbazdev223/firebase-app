const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    start: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      required: false,
      trim: true,
    },
    branch: [
      {
        type: String,
        enum: ['Kalkaji', 'Badarpur'], // Example branches
      },
    ],
    department: [
      {
        type: String,
      },
    ],
    userId: [
      {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
