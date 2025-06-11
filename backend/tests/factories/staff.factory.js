import Staff from '../../models/staff.model.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export async function createTestStaff(restaurant = new mongoose.Types.ObjectId()) {
    const username = "username";
    const password = await bcrypt.hash('Password@123', 10);
    const role = 'staff';

    const staff = new Staff({
       username,
       password,
       role,
       restaurant
    });
    return staff;
}