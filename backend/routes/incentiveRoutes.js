// routes/incentiveRoutes.js
const express = require('express');
const router = express.Router();
const incentiveController = require('../controllers/incentiveController');

router.post('/', incentiveController.create);
router.get('/', incentiveController.getAll);
router.get('/:id', incentiveController.getById);
router.put('/:id', incentiveController.update);
router.delete('/:id', incentiveController.delete);

module.exports = router;