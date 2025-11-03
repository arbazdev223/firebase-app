const multer = require('multer');

// Set up file storage and file filter
const storage = multer.memoryStorage();  // Store file in memory
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Max file size: 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'text/csv' && file.mimetype !== 'application/vnd.ms-excel') {
      return cb(new Error('Only CSV files are allowed.'));
    }
    cb(null, true);
  },
});

module.exports = upload;
