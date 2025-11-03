const express = require('express');
const upload = require('../utils/loadManager');
const enqureController = require('../controllers/enqureController');
const router = express.Router();

router.get('/getdemos', enqureController.getAllDemos);
router.post('/demos', enqureController.createDemo);
router.get('/demos/:id', enqureController.getDemoById);
router.put('/demos/:id', enqureController.updateDemo);

module.exports = router;