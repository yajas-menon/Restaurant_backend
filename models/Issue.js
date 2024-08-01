// models/Issue.js
const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  sectionName:{type:String},  
  faultType: { type: String, required: true },
  deviceName: { type: String, required: true },
  deviceCode: { type: String, required: true },
  description: { type: String, required: true },
  issuePhoto: { type: String }, // Store the path to the photo
  status: {
    type: String,
    enum: ['Unresolved', 'Resolved'],
    default: 'Unresolved', // Default status
  },
});

const Issue = mongoose.model('Issue', issueSchema);
module.exports = Issue;
