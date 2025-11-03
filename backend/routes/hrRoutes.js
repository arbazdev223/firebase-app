const express = require('express');
const { CandidateController, upload } = require('../controllers/CandidateController'); // Assuming controllers are in the controllers folder
const jobPostController = require('../controllers/jobPostController');
const router = express.Router();
const jdController  = require("../controllers/jdController");



// Define routes for Candidate resource
router.post('/candidates', upload.single('file'), CandidateController.create); // Correct route for candidates
router.get('/candidates', CandidateController.getAll); // Get all candidates
router.get('/candidates/:id', CandidateController.getById); // Get a candidate by ID
router.put('/candidates/:id', upload.single('file'), CandidateController.update); // Update a candidate with optional file upload
router.put('/intrested/candidate',  CandidateController.updateCandidateStatus); // Update a candidate with optional file upload
router.delete('/candidates/:id', CandidateController.delete); // Delete a candidate by ID
router.get('/job-posts', jobPostController.getAllJobPosts);

// CRUD routes for JD
router.post("/", jdController.createJd);
router.get("/", jdController.getAllJds);
router.get("/:id", jdController.getJdById);
router.put("/:id", jdController.updateJd);
router.delete("/:id", jdController.deleteJd);

// Create a new job post
router.post('/job-posts', upload.single('file'), jobPostController.createJobPost);

// Get all job posts

// Get a specific job post by ID
router.get('/job-posts/:id', jobPostController.getJobPostById);

// Update a job post
router.put('/job-posts/:id', jobPostController.updateJobPost);

// Delete a job post
router.delete('/job-posts/:id', jobPostController.deleteJobPost);

module.exports = router;