// routes/issues.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Issue = require('../models/Issue');

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer for file uploads
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage });

router.post('/create', upload.single('issuePhoto'), async (req, res) => {
  try {
    const { faultType, deviceName, deviceCode, description, sectionName } = req.body;
    const issuePhoto = req.file ? req.file.path : '';

    const newIssue = new Issue({
      faultType,
      deviceName,
      deviceCode,
      description,
      issuePhoto,
      sectionName, // Save the section name
    });

    await newIssue.save();
    res.status(201).json(newIssue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all', async (req, res) => {
    try {
      const issues = await Issue.find().select('deviceName deviceCode description status');
      res.status(200).json(issues);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;
