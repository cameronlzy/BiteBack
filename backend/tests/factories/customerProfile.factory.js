import mongoose from 'mongoose';
import CustomerProfile from '../../models/customerProfile.model.js';

export function createTestCustomerProfile(user = new mongoose.Types.ObjectId()) {
    const contactNumber = 98765432;
    const name = `test_${Date.now()}`;

    const profile = new CustomerProfile({
        user, name, contactNumber
    });
    return profile;
}