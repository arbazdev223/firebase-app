const JobListing = require('../models/JobListing');

// Create a new job listing
exports.createJobListing = async (req, res) => {
  try {
    const job = new JobListing(req.body);
    await job.save();
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Create multiple job listings
exports.createMultipleJobListings = async (req, res) => {
  try {
    const inputJobs = req.body;

    // Get existing job_links from the database
    const existingLinks = await JobListing.find({
      job_link: { $in: inputJobs.map(job => job.job_link) }
    }).distinct("job_link");

    // Filter out jobs with existing job_links
    const newJobs = inputJobs.filter(job => {
      // Include the job even if 'phone' is missing
      // Only skip if the job_link is already present
      return !existingLinks.includes(job.job_link);
    });

    if (newJobs.length === 0) {
      return res.status(200).json({ success: false, message: "No new job listings to insert." });
    }

    const insertedJobs = await JobListing.insertMany(newJobs);
    res.status(201).json({ success: true, data: insertedJobs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all job listings
exports.getAllJobListings = async (req, res) => {
  try {
    const jobs = await JobListing.find();
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a single job listing by ID
exports.getJobListingById = async (req, res) => {
  try {
    const job = await JobListing.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update a job listing
exports.updateJobListing = async (req, res) => {
  try {
    const job = await JobListing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete a job listing
exports.deleteJobListing = async (req, res) => {
  try {
    const job = await JobListing.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
