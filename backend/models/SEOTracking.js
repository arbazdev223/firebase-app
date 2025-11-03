const mongoose = require('mongoose');

const backlinkUrlSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    domain: {
        type: String,
        required: true
    },
    daScore: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'live', 'rejected'],
        default: 'pending'
    }
});

const contentDetailsSchema = new mongoose.Schema({
    wordCount: {
        type: Number,
        default: 0
    },
    contentType: {
        type: String,
        enum: ['blog', 'article', 'landing_page', 'product_page', 'other'],
        default: 'other'
    },
    targetKeywords: [String],
    publishedUrl: String
});

const technicalDetailsSchema = new mongoose.Schema({
    pageSpeed: {
        type: Number,
        default: 0
    },
    mobileFriendly: {
        type: Boolean,
        default: false
    },
    sslStatus: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'pending'
    },
    technicalIssues: [String]
});

const proofOfWorkSchema = new mongoose.Schema({
    screenshots: [String],
    links: [String],
    notes: {
        type: String,
        default: ''
    }
});

const seoWorkSchema = new mongoose.Schema({
    workType: {
        type: String,
        enum: ['backlink', 'onpage', 'technical', 'content', 'local', 'other'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true,
        default: 1
    },
    backlinkUrls: [backlinkUrlSchema],
    contentDetails: contentDetailsSchema,
    technicalDetails: technicalDetailsSchema,
    proofOfWork: {
        type: proofOfWorkSchema,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    verificationNotes: {
        type: String,
        default: ''
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    }
});

const seoTrackingSchema = new mongoose.Schema({
    user: {
        id: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        department: {
            type: String,
            required: true
        }
    },
    date: {
        type: Date,
        default: Date.now
    },
    seoWork: [seoWorkSchema],
    totalWorkCount: {
        type: Number,
        default: 0
    },
    verifiedWorkCount: {
        type: Number,
        default: 0
    },
    overallStatus: {
        type: String,
        enum: ['pending', 'partially_verified', 'verified', 'rejected'],
        default: 'pending'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    lastUpdatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update lastUpdatedAt before saving
seoTrackingSchema.pre('save', function(next) {
    this.lastUpdatedAt = new Date();
    next();
});

module.exports = mongoose.model('SEOTracking', seoTrackingSchema); 