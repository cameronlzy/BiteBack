import OwnerProfile from '../../models/ownerProfile.model.js';
import mongoose from 'mongoose';

export function createTestOwnerProfile(user = new mongoose.Types.ObjectId()) {
    const companyName = "name";

    const profile = new OwnerProfile({
       user, companyName, restaurants: [new mongoose.Types.ObjectId()]
    });
    return profile;
}
