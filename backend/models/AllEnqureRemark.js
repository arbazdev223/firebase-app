const mongoose = require('mongoose');

const RemarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', },
  reply: { type: String, },
}, { timestamps: true });

const AllEnquiryRemarkSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  source: {
    type: String,
  },
  student_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enqure' 
  },
  conversionRate: { 
    type: String 
  },
  response: { 
    type: String 
  },
  formType: { 
    type: String 
  },
  department: { 
    type: String 
  },
  remarks: { 
    type: String 
  },
  reply: [RemarkSchema],
}, { 
  timestamps: true 
});

module.exports = mongoose.model('AllRemark', AllEnquiryRemarkSchema);