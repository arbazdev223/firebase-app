const express = require('express');
const router = express.Router();
const jobListingController = require('../controllers/jobListingController');

router.post('/', jobListingController.createJobListing);
router.get('/', jobListingController.getAllJobListings);
router.get('/:id', jobListingController.getJobListingById);
router.put('/:id', jobListingController.updateJobListing);
router.delete('/:id', jobListingController.deleteJobListing);
router.post('/job-listings/bulk', jobListingController.createMultipleJobListings);

module.exports = router;
