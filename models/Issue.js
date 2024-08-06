// models/Issue.js
const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  sectionName: { 
    type: String, 
    required: true },
  faultType: {
     type: String, 
     required: true },
  deviceName: {
     type: String, 
     required: true },
  deviceCode: { 
    type: String, 
    required: true },
  description: { 
    type: String, 
    required: true },
  issuePhoto: { 
    type: String, 
    required: true },
  resolvedPhoto: { 
    type: String 
  }, // Add this field for resolved photo
  status: { 
    type: String, 
    default: 'Pending' 
  } // Add this field for issue status
}, { timestamps: true });

const Issue = mongoose.model('Issue', issueSchema);
module.exports = Issue;
