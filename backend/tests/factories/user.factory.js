const bcrypt = require('bcrypt');
const User = require('../../models/user.model');
const mongoose = require('mongoose');

async function createTestUser(role = 'customer') {
  const email = `test_${Date.now()}@example.com`;
  const username = `user_${Date.now()}`;
  const password = await bcrypt.hash('Test@1234', 10);

  const roleProfile = role === 'customer' ? 'CustomerProfile' : 'OwnerProfile';

  const user = new User({
    email,
    username,
    password,
    role,
    roleProfile,
    profile: new mongoose.Types.ObjectId(),
  });
  return user;
}

module.exports = { createTestUser };
