const Staff = require('../../models/staff.model');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createTestStaff(restaurant = new mongoose.Types.ObjectId()) {
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

module.exports = { createTestStaff };