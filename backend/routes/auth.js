const auth = require('../middleware/auth');
const { User } = require('../models/user');
const express = require('express');
const router = express.Router();

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('profile')
    .select('-password');
  res.send(user);
});

module.exports = router; 
