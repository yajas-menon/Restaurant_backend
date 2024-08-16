const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();



const router = express.Router();

// Register
// router.post('/register', async (req, res) => {
//   const { name, email, password, role } = req.body;

//   try {
//     let user = await User.findOne({ email });
//     if (user) {
//       return res.status(400).json({ msg: 'User already exists' });
//     }

//     user = new User({ name, email, password, role });

//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(password, salt);

//     await user.save();

//     const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
//         expiresIn: '1h',
//     });

//     res.status(201).json({ message: 'User registered successfully', token, user: { username: user.name, email: user.email, role: user.role } });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// });

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    if (role === 'Admin') {
      const adminExists = await User.findOne({ role: 'Admin' });
      if (adminExists) {
        return res.status(400).json({ msg: 'Admin already exists' });
      }
    }

    user = new User({ name, email, password, role , isApproved: role === 'Admin'  });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({ message: 'User registered successfully', token, user: { username: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user ) {
        return res.status(403).json({ msg: 'Invalid email or password' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ msg: 'Your account approval is pending by the admin.' });
  }

    // Check the password here
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user });
} catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
}
    
  });

  router.get('/allusers', async (req, res) => {
    try {
        const pendingUsers = await User.find({});
        res.json(pendingUsers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error fetching users' });
    }
});

router.post('/approve', async (req, res) => {
    try {
        const { userId } = req.body;
        await User.findByIdAndUpdate(userId, { isApproved: true });
        res.json({ msg: 'User approved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error approving user' });
    }
});

router.post('/reject', async (req, res) => {
  try {
      const { userId } = req.body;
      
      // Fetch the user from the database
      const user = await User.findById(userId);
      
      if (!user) {
          return res.status(404).json({ msg: 'User not found' });
      }
      
      // Check if the user is an admin
      if (user.role === 'Admin') {
          return res.status(403).json({ msg: 'Admins cannot be deleted' });
      }
      
      // Delete the user if not an admin
      await User.findByIdAndDelete(userId);
      res.json({ msg: 'User rejected and deleted' });
  } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Error rejecting user' });
  }
});

  
  
module.exports = router;