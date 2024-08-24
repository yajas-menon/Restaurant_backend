// routes/issues.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const Issue = require('../models/Issue');


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



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

// Endpoint to User Dashboard
router.get('/summary', async (req, res) => {
  try {
    const summary = await Issue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Create a structured response
    const result = {
      issueFixed: 0,
      openIssues: 0,
      rejectedIssues: 0,
      pendingIssues: 0
    };

    summary.forEach(item => {
      if (item._id === 'Resolved') {
        result.issueFixed = item.count;
      } else if (item._id === 'Open' || item._id === 'Pending Approval') {
        result.openIssues += item.count;
      } else if (item._id === 'Rejected') {
        result.rejectedIssues = item.count;
      } else if (item._id === 'Pending Approval') {
        result.pendingIssues = item.count;
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching issue summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/add-remark/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const { remark } = req.body;

      const issue = await Issue.findById(id);
      if (!issue) {
          return res.status(404).json({ message: 'Issue not found' });
      }

      issue.remark = remark;
      issue.status = 'Open'; // Ensure status stays 'Open' when adding a remark
      await issue.save();

      res.status(200).json({ message: 'Remark added successfully', data: issue });
  } catch (error) {
      res.status(500).json({ message: 'Error adding remark', error });
  }
});

// Graph Metrics 
router.get('/total-issues', async (req, res) => {
  try {
      const totalIssuesCount = await Issue.countDocuments({});
      res.json({ totalIssues: totalIssuesCount });
  } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Error fetching total issues count' });
  }
});

// Route to get the count of issues based on status (for Issues WIP)
router.get('/issues-status', async (req, res) => {
  try {
      const issues = await Issue.find({
          status: { $in: ['Pending', 'Open', 'Pending Approval','Resolved','Rejected'] }
      });

      // Group issues by status
      const issuesGroupedByStatus = issues.reduce((acc, issue) => {
          acc[issue.status] = (acc[issue.status] || 0) + 1;
          return acc;
      }, {});

      res.json(issuesGroupedByStatus);
  } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Error fetching issues by status' });
  }
});




module.exports = router;
