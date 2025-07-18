import bcrypt from 'bcryptjs';
import User from '../../models/user.model.js';
import mongoose from 'mongoose';

export async function createTestUser(role = 'customer') {
  const email = `test_${Date.now()}@example.com`;
  const username = `user_${Date.now()}`;
  const password = await bcrypt.hash('Password@123', 10);
  const isVerified = true;

  const roleProfile = role === 'customer' ? 'CustomerProfile' : 'OwnerProfile';

  const user = new User({
    email,
    username,
    password,
    role,
    roleProfile,
    profile: new mongoose.Types.ObjectId(),
    isVerified,
  });
  return user;
}
