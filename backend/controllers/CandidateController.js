const AWS = require('aws-sdk');
const Candidate = require('../models/Candidate'); // Assuming the model is in the models folder
const User = require('../models/User');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// Configure R2 bucket (using AWS SDK)
const s3 = new AWS.S3({
    endpoint: 'https://582328aa44fe3bcd4d90060e0a558eae.r2.cloudflarestorage.com', // Updated environment variable name
    accessKeyId: '477949571b2baa26ff5b94195b93dd76', // Updated environment variable name
    secretAccessKey: 'd42e9da877365aabdbd7b59c1e3a543cb20ce4a321801b249f8e29c51fb6a7c8', // Updated environment variable name
    region: 'auto', // Updated environment variable name
});

const BUCKET_NAME = 'lms'; // Updated environment variable name

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Candidate Controller
class CandidateController {
    // Create a new candidate
    static async create(req, res) {
        try {
            const { name, relevent, Reference, source, candidatePhone, candidateEmail, candidateProfile, candidatePrfileURL, candidateLocation, candidateExperience, currentSalary, candidateExpected, reason, candidateQualification, candidateNoticePeriod, cvReceived, interviewDate, interviewerName, followUpDate, interviewStatus, remark  } = req.body;

            let fileUrl = null;
            
            // Handle file upload
            if (req.file) {
                const fileKey = `hr/candidate/${uuidv4()}_${req.file.originalname}`;
                await s3.upload({
                    Bucket: BUCKET_NAME,
                    Key: fileKey,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype,
                }).promise();

                fileUrl = `${'https://imsdata.ifda.in/'}${fileKey}`; 
            }

            // Create candidate entry
            const candidate = new Candidate({
                relevent,
                source,
                file: fileUrl,
                name,
                Reference,
                candidatePhone,
                candidateEmail,
                candidateProfile,
                candidatePrfileURL,
                candidateLocation,
                candidateExperience,
                currentSalary,
                candidateExpected,
                reason,
                candidateQualification,
                candidateNoticePeriod,
                cvReceived,
                interviewerName,
                interviewDate,
                followUpDate,
                interviewStatus,
                remark: remark ? { ...remark } : null // Assign the remark object
            });

            await candidate.save();

            return res.status(201).json({ message: 'Candidate created successfully', candidate });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error creating candidate', error });
        }
    }

    // Get all candidates
    static async getAll(req, res) {
        try {
            const candidates = await Candidate.find()
            .populate({
                path: 'interviewerName',
                select: 'name email'
            })
            
                .populate({
                    path: 'remarks.userId',
                    select: 'name email' // Select only necessary fields from the User model
                })
                .populate({
                    path: 'training.userId',
                    select: 'name email' // Select user data for training schema
                });
    
            return res.status(200).json(candidates);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error fetching candidates', error });
        }
    }
    

    // Get a candidate by ID
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const candidate = await Candidate.findById(id);

            if (!candidate) {
                return res.status(404).json({ message: 'Candidate not found' });
            }

            return res.status(200).json(candidate);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error fetching candidate', error });
        }
    }

    // Update a candidate by ID
    static async update(req, res) {
        try {
            const { id } = req.params; // Candidate ID
            const updates = { ...req.body }; // Spread to avoid mutation
            let fileUrl = null;
    
            // Handle file upload
            if (req.file) {
                const fileKey = `hr/candidate/${uuidv4()}_${req.file.originalname}`;
                await s3.upload({
                    Bucket: BUCKET_NAME,
                    Key: fileKey,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype,
                }).promise();
    
                fileUrl = `${process.env.AWS_URL}${fileKey}`;
                updates.file = fileUrl;
            }
    
            // Check if new remarks are being added
            if (updates.remarks && Array.isArray(updates.remarks)) {
                const newRemarks = updates.remarks.map((remark) => {
                    if (!remark.userId || !remark.Status || !remark.remark) {
                        throw new Error("Invalid remark data");
                    }
    
                    // Validate and ensure `userId` is an ObjectId
                    return {
                        userId: mongoose.isValidObjectId(remark.userId)
                            ? remark.userId
                            : mongoose.Types.ObjectId(remark.userId),
                        Status: remark.Status,
                        remark: remark.remark,
                    };
                });
    
                // Push new remarks into the remarks array
                await Candidate.findByIdAndUpdate(
                    id,
                    { $push: { remarks: { $each: newRemarks } } },
                    { new: true }
                );
    
                // Remove remarks from general updates to avoid overwriting
                delete updates.remarks;
            }
    
            // Perform other updates if there are any remaining fields
            const candidate = await Candidate.findByIdAndUpdate(id, updates, { new: true });
    
            if (!candidate) {
                return res.status(404).json({ message: 'Candidate not found' });
            }
    
            // Return the updated candidate
            return res.status(200).json({ message: 'Candidate updated successfully', candidate });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message || 'Error updating candidate', error });
        }
    }
    
    // Update interviewStatus using candidatePhone
static async updateCandidateStatus(req, res) {
    try {
        const { candidatePhone } = req.body;

        // Ensure both candidatePhone and interviewStatus are provided
        if (!candidatePhone) {
            return res.status(400).json({ message: "candidatePhone and interviewStatus are required." });
        }

        // Find and update the candidate's interviewStatus based on candidatePhone
        const candidate = await Candidate.findOneAndUpdate(
            { candidatePhone }, // Query by phone number
            { interviewStatus: "Interested" },
            { new: true } // Return the updated document
        );

        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found with the provided phone number.' });
        }

        return res.status(200).json({ message: 'Candidate status updated successfully', candidate });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating candidate status', error });
    }
}


    
    // Delete a candidate by ID
    static async delete(req, res) {
        try {
            const { id } = req.params;

            const candidate = await Candidate.findByIdAndDelete(id);

            if (!candidate) {
                return res.status(404).json({ message: 'Candidate not found' });
            }

            return res.status(200).json({ message: 'Candidate deleted successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error deleting candidate', error });
        }
    }
}

module.exports = { CandidateController, upload };
