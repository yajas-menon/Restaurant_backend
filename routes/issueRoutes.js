// routes/issues.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const Issue = require('../models/Issue');





// Azure Blob Storage configuration
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient('hotelmanagement');

// Endpoint to create a new issue
router.post('/create', upload.single('issuePhoto'), async (req, res) => {
  try {
    const { sectionName, faultType, deviceName, deviceCode, description } = req.body;

    // Upload image to Azure Blob Storage
    const blobName = uuidv4() + path.extname(req.file.originalname);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(req.file.buffer);

    const issuePhotoUrl = blockBlobClient.url;

    // Save issue data and image URL to MongoDB
    const newIssue = new Issue({
      sectionName,
      faultType,
      deviceName,
      deviceCode,
      description,
      issuePhoto: issuePhotoUrl, // Save the URL of the image
    });

    await newIssue.save();
    res.status(201).json(newIssue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Endpoint to fetch all issues from MongoDB
router.get('/all', async (req, res) => {
  try {
    const issues = await Issue.find({});
    res.status(200).send({ status: 'ok', data: issues });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Endpoint to upload resolved photo
router.post('/resolve/:id', upload.single('resolvedPhoto'), async (req, res) => {
  try {
    const { id } = req.params;

    // Upload image to Azure Blob Storage
    const blobName = uuidv4() + path.extname(req.file.originalname);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(req.file.buffer);

    const resolvedPhotoUrl = blockBlobClient.url;

    // Update issue with resolved photo URL
    const issue = await Issue.findByIdAndUpdate(
      id,
      { resolvedPhoto: resolvedPhotoUrl, status: 'Pending Approval' }, // Update status to Pending Approval
      { new: true }
    );

    res.status(200).json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to update the issue status
router.post('/update-status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const issue = await Issue.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.status(200).json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/metrics', async (req, res) => {
  try {
    const issues = await Issue.find();

    const metrics = {
      issueFixed: {
        bulbs: issues.filter(issue => issue.deviceName === 'bulb' && issue.status === 'Resolved').length,
        wifi: issues.filter(issue => issue.deviceName === 'Wi-Fi device' && issue.status === 'Resolved').length,
        acs: issues.filter(issue => issue.deviceName === 'ac' && issue.status === 'Resolved').length,
        taps: issues.filter(issue => issue.deviceName === 'taps' && issue.status === 'Resolved').length,
      },
      openIssues: {
        bulbs: issues.filter(issue => issue.deviceName === 'bulb' && issue.status === 'Pending').length,
        wifi: issues.filter(issue => issue.deviceName === 'Wi-Fi device' && issue.status === 'Pending').length,
        acs: issues.filter(issue => issue.deviceName === 'ac' && issue.status === 'Pending').length,
        taps: issues.filter(issue => issue.deviceName === 'taps' && issue.status === 'Pending').length,
      },
      pendingIssues: {
        bulbs: issues.filter(issue => issue.deviceName === 'bulb' && issue.status === 'Pending Approval').length,
        wifi: issues.filter(issue => issue.deviceName === 'Wi-Fi device' && issue.status === 'Pending Approval').length,
        acs: issues.filter(issue => issue.deviceName === 'ac' && issue.status === 'Pending Approval').length,
        taps: issues.filter(issue => issue.deviceName === 'taps' && issue.status === 'Pending Approval').length,
      },
      
      rejectedIssues: {
        bulbs: issues.filter(issue => issue.deviceName === 'bulb' && issue.status === 'Rejected').length,
        fans: issues.filter(issue => issue.deviceName === 'fan' && issue.status === 'Rejected').length,
        acs: issues.filter(issue => issue.deviceName === 'ac' && issue.status === 'Rejected').length,
        taps: issues.filter(issue => issue.deviceName === 'taps' && issue.status === 'Rejected').length,
      },
    };

    res.json({ metrics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/section-metrics', async (req, res) => {
  try {
    const sections = ['kitchen', 'dining', 'room', 'bathroom', 'reception'];
    const metrics = {};

    for (const section of sections) {
      metrics[section] = await Issue.countDocuments({ sectionName: section, status: { $ne: 'Resolved' } });
    }

    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching section metrics:', error);
    res.status(500).send('Server error');
  }
});






module.exports = router;
