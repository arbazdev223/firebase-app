const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileController = require('../controllers/fileController');

// Always use memoryStorage so fileController can upload to S3
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), fileController.uploadFile);

module.exports = router; 