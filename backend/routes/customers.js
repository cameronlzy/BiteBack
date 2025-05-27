const express = require('express');
const { User } = require('../models/user');
const { CustomerProfile, validateCustomer } = require('../models/customerProfile');
const wrapRoutes = require('../utils/wrapRoutes');
const router = wrapRoutes(express.Router());
const validateObjectId = require('../middleware/validateObjectId');

router.get('/:id', validateObjectId, async (req, res) => {
    // get user
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found.');
    if (user.role != 'customer') return res.status(400).send('Id does not belong to a customer.');

    // get customer profile
    const profile = await CustomerProfile.findById(user.profile)
        .select({ dateJoined: 1, badgesCount: 1, id: 0 }).lean();

    // get customer's reviews
    const reviews = await Review.find({ customer: user.profile });
    
    profile.reviews = reviews;
    return res.send(profile);
});