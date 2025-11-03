const express = require('express');
const controller = require('../controllers/finalStudentFeedbackController');

const router = express.Router();

router.post('/', controller.createFinalStudentFeedback);
router.get('/', controller.getFinalStudentFeedbacks);
router.get('/:id', controller.getFinalStudentFeedbackById);
router.put('/:id', controller.updateFinalStudentFeedback);
router.delete('/:id', controller.deleteFinalStudentFeedback);

module.exports = router;
