import Staff from '../../models/staff.model.js';
import mongoose from 'mongoose';
import { generateStaffUsername, generateStaffHashedPassword } from '../../helpers/staff.helper.js';

export async function createTestStaff(restaurant = new mongoose.Types.ObjectId()) {
    const username = generateStaffUsername('restaurant');
    const { hashedPassword, encryptedPassword } = await generateStaffHashedPassword();
    const role = 'staff';

    const staff = new Staff({
       username,
       password: hashedPassword,
       encryptedPassword,
       role,
       restaurant
    });
    return staff;
}