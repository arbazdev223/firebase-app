const SEOTracking = require('../models/SEOTracking');

// Create new SEO tracking entry
const createSEOTracking = async (req, res) => {
    try {
        const { user, seoWork } = req.body;
        
        // Calculate total work count
        const totalWorkCount = seoWork.reduce((total, work) => total + work.count, 0);
        
        const trackingData = new SEOTracking({
            user,
            date: new Date(),
            seoWork,
            totalWorkCount,
            verifiedWorkCount: 0,
            overallStatus: 'pending'
        });

        const savedData = await trackingData.save();
        res.status(201).json({
            success: true,
            data: savedData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all SEO tracking data (for admin)
const getAllSEOTracking = async (req, res) => {
    try {
        const { department, status, startDate, endDate } = req.query;
        
        let query = {};
        
        if (department) {
            query['user.department'] = department;
        }
        
        if (status) {
            query.overallStatus = status;
        }
        
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const trackingData = await SEOTracking.find(query).sort({ date: -1 });
        
        res.status(200).json({
            success: true,
            data: trackingData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get SEO tracking data by user
const getSEOTrackingByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const trackingData = await SEOTracking.find({ 'user.id': userId }).sort({ date: -1 });
        
        res.status(200).json({
            success: true,
            data: trackingData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get statistics
const getStats = async (req, res) => {
    try {
        const totalEntries = await SEOTracking.countDocuments();
        
        const allData = await SEOTracking.find({});
        const totalWorkCount = allData.reduce((total, entry) => total + entry.totalWorkCount, 0);
        const totalVerifiedWork = allData.reduce((total, entry) => total + entry.verifiedWorkCount, 0);
        
        const averageWorkPerEntry = totalEntries > 0 ? Math.round(totalWorkCount / totalEntries) : 0;
        
        const stats = {
            totalEntries,
            totalWorkCount,
            totalVerifiedWork,
            averageWorkPerEntry
        };
        
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Verify work item
const verifyWork = async (req, res) => {
    try {
        const { trackingId, workIndex, status, notes } = req.body;
        
        const trackingData = await SEOTracking.findById(trackingId);
        
        if (!trackingData) {
            return res.status(404).json({
                success: false,
                message: 'Tracking data not found'
            });
        }
        
        if (workIndex >= 0 && workIndex < trackingData.seoWork.length) {
            trackingData.seoWork[workIndex].status = status;
            
            // Update verified work count
            const verifiedCount = trackingData.seoWork.filter(work => work.status === 'verified').length;
            trackingData.verifiedWorkCount = verifiedCount;
            
            // Update overall status
            if (verifiedCount === trackingData.seoWork.length) {
                trackingData.overallStatus = 'verified';
            } else if (verifiedCount > 0) {
                trackingData.overallStatus = 'partially_verified';
            } else {
                trackingData.overallStatus = 'pending';
            }
            
            // Add verification notes
            if (notes) {
                trackingData.seoWork[workIndex].verificationNotes = notes;
            }
            
            await trackingData.save();
            
            res.status(200).json({
                success: true,
                data: trackingData
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid work index'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createSEOTracking,
    getAllSEOTracking,
    getSEOTrackingByUser,
    getStats,
    verifyWork
}; 