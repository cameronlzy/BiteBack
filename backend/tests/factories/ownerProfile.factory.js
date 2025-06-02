const OwnerProfile = require('../../models/ownerProfile.model');
const mongoose = require('mongoose');

function createTestOwnerProfile(user = null) {
    const companyName = "name";
    let username;
    if (!user) {
        username = `user_${Date.now()}`;
    } else {
        username = user.username;
    }

    const profile = new OwnerProfile({
       user: user._id,
       username, companyName, restaurants: [new mongoose.Types.ObjectId()]
    });
    return profile;
}

module.exports = { createTestOwnerProfile };