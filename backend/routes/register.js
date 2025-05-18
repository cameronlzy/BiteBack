const bcrypt = require('bcrypt');
const _ = require('lodash');
const { User } = require('../models/user');
const { CustomerProfile, validateCustomer } = require('../models/customerProfile');
const { OwnerProfile, validateOwner } = require('../models/ownerProfile');
const { createRestaurantArray } = require('../models/restaurant');
const express = require('express');

const router = express.Router();

router.post('/', async (req, res) => {
    if (!req.body.role) return res.status(400).send('Bad request.');
    if (req.body.role == "customer") {
        // validate request
        const { error } = validateCustomer(req.body); 
        if (error) return res.status(400).send(error.details[0].message);

        // if user exists
        let existingUser = await User.findOne({ email: req.body.email });
        if (existingUser && existingUser.role == 'customer') return res.status(400).send('Customer already registered.');
        if (existingUser && existingUser.role == 'owner') return res.status(400).send('Email registered to a restaurant owner.');

        // create a customer profile
        let customerProfile = new CustomerProfile(_.pick(req.body, 
            ['name', 'contactNumber', 'favCuisines']));

        // create new user
        let user = new User(_.pick(req.body, ['email', 'username', 'password', 'role']));
        customerProfile.user = user._id;
        await customerProfile.save();

        // hash password and add references
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.roleProfile = 'CustomerProfile';
        user.profile = customerProfile._id;
        await user.save();

        const token = user.generateAuthToken();
        res.header('x-auth-token', token).send(_.pick(user, ['_id', 'email', 'username', 'role']));
    }

    if (req.body.role == "owner") {
        // validate request
        const { error } = validateOwner(req.body); 
        if (error) return res.status(400).send(error.details[0].message);

        // if user exists
        let existingUser = await User.findOne({ email: req.body.email });
        if (existingUser && existingUser.role == 'owner') return res.status(400).send('Restaurant already registered.');
        if (existingUser && existingUser.role == 'customer') return res.status(400).send('Email registered to a customer.');

        // create restaurant array
        let restaurants;
        try {
            restaurants = await createRestaurantArray(req.body.restaurants);
        } catch (err) {
            return res.status(400).send('Incorrect restaurant information.');
        }

        // create a owner profile
        let ownerProfile = new OwnerProfile(_.pick(req.body, ['companyName']));

        // create new user
        let user = new User(_.pick(req.body, ['email', 'username', 'password', 'role']));
        ownerProfile.user = user._id;
        ownerProfile.restaurants = restaurants;
        await ownerProfile.save();

        // hash password and add references
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.roleProfile = 'OwnerProfile';
        user.profile = ownerProfile._id;
        await user.save();

        const token = user.generateAuthToken();
        res.header('x-auth-token', token).send(_.pick(user, ['_id', 'email', 'username', 'role']));
    }
});

module.exports = router; 
