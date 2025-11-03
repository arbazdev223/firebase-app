const express = require('express');
const controller = require('../controllers/courseMcqTestController');

const router = express.Router();

router.post('/', controller.createCourseMcqTest);
router.get('/', controller.getCourseMcqTests);
router.get('/attempts/:attemptId', controller.getCourseMcqAttemptById);
router.get('/:id', controller.getCourseMcqTestById);
router.put('/:id', controller.updateCourseMcqTest);
router.patch('/:id/active', controller.toggleCourseMcqTestActiveState);
router.delete('/:id', controller.deleteCourseMcqTest);

router.post('/:id/submit', controller.submitCourseMcqTest);
router.get('/:id/attempts', controller.getCourseMcqAttempts);

module.exports = router;
