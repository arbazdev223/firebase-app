const Event = require('../models/Event'); // Path to your Event model

// Controller to create a new event
exports.createEvent = async (req, res) => {
  try {
    const { title, start, note, branch, department, userId } = req.body;

    const event = new Event({
      title,
      start,
      note,
      branch,
      department,
      userId,
    });

    await event.save();
    res.status(201).json({
      message: 'Event created successfully!',
      event,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Controller to get all events
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Controller to get a specific event by ID
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Controller to update an event by ID
exports.updateEvent = async (req, res) => {
  try {
    const { title, start, note, branch, department, userId } = req.body;

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { title, start, note, branch, department, userId },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({
      message: 'Event updated successfully!',
      event: updatedEvent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Controller to delete an event by ID
exports.deleteEvent = async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json({ message: 'Event deleted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};
