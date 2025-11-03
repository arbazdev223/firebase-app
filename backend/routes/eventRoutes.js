const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// Route to create an event
router.post('/events', eventController.createEvent);

// Route to get all events
router.get('/events', eventController.getAllEvents);

// Route to get a specific event by ID
router.get('/events/:id', eventController.getEventById);

// Route to update an event by ID
router.put('/events/:id', eventController.updateEvent);

// Route to delete an event by ID
router.delete('/events/:id', eventController.deleteEvent);

module.exports = router;
