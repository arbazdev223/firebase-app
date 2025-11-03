const express = require('express');
const router = express.Router();
const batchTimingController = require('../controllers/batchTimingController');

// Routes
router.post('/', batchTimingController.createBatchTiming);
router.get('/', batchTimingController.getAllBatchTimings);
router.get('/:id', batchTimingController.getBatchTimingById);
router.put('/:id', batchTimingController.updateBatchTiming);
router.delete('/:id', batchTimingController.deleteBatchTiming);
router.put('/:batchTimingId/slots/:slotId', batchTimingController.updateSlotInBatchTiming);
module.exports = router;
