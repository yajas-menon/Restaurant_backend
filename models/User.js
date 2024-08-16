const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['User', 'Admin'], required: true },
  isApproved: {
    type: Boolean,
    default: false, // New users are not approved by default
  },
});

module.exports = mongoose.model('User', userSchema);
