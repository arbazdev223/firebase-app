const express = require('express');
const router = express.Router();
const FaqsController = require('../controllers/FaqsController');

// Route to create a new FAQ
router.post('/createCategory', FaqsController.createCategory);

// Route to get all FAQs
router.get('/getAllCategories', FaqsController.getAllCategories);

// Route to create a new FAQ
router.post('/faq', FaqsController.createFaq);

// Route to get all FAQs
router.get('/faqs', FaqsController.getFaqs);

// Route to update an existing FAQ by ID
router.put('/faq/:id', FaqsController.updateFaq);

// Route to delete an FAQ by ID
router.delete('/faq/:id', FaqsController.deleteFaq);

module.exports = router;
