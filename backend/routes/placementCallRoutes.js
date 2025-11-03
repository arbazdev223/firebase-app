const express = require('express');
const router = express.Router();
const placementCallController = require('../controllers/placementCallController');

router.post('/', placementCallController.createPlacementCall);
router.get('/', placementCallController.getAllPlacementCalls);
router.get('/:id', placementCallController.getPlacementCallById);
router.put('/:id', placementCallController.updatePlacementCall);
router.delete('/:id', placementCallController.deletePlacementCall);

module.exports = router;
