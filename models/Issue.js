const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    sectionName:String,
    deviceName:String,
    deviceCode: String,
    description: String,
    issuePhoto: String,
    resolvedPhoto: String,
    status: {
        type: String,
        default: 'Open',
        enum: ['Open', 'Pending Approval', 'Resolved', 'Rejected']
    },
    remark: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Issue', issueSchema);
