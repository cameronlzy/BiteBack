const auth = require('../middleware/auth');
const { User } = require('../models/user');
const express = require('express');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const _ = require('lodash');
const { CustomerProfile, validateCustomer } = require('../models/customerProfile');
const { OwnerProfile, validateOwner } = require('../models/ownerProfile');
const { createRestaurantArray } = require('../models/restaurant');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('profile')
    .select('-password');
  res.send(user);
});

router.post('/login', async (req, res) => {
    // validate request
    const { error } = validate(req.body); 
    if (error) return res.status(400).send(error.details[0].message);

    // find user by email or username
    let user;
    if (req.body.email) {
      user = await User.findOne({ email: req.body.email });
    } else {
      user = await User.findOne({ username: req.body.username });
    }
    if (!user) return res.status(400).send('Invalid email or password.');

    // check password
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send('Invalid email or password.');

    const token = user.generateAuthToken();
    res.header('x-auth-token', token).send(_.pick(user, ['_id', 'email', 'username', 'role']));
});

router.post('/register', async (req, res) => {
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
        if (existingUser && existingUser.role == 'owner') return res.status(400).send('Restaurant owner already registered.');
        if (existingUser && existingUser.role == 'customer') return res.status(400).send('Email registered to a customer.');

        // create new user
        let user = new User(_.pick(req.body, ['email', 'username', 'password', 'role']));

        // hash password and add references
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.roleProfile = 'OwnerProfile';
        user.profile = new mongoose.Types.ObjectId();
        await user.save();

        // create restaurant array
        let restaurants;
        try {
            restaurants = await createRestaurantArray(req.body.restaurants, user._id);
        } catch (err) {
            return res.status(400).send('Incorrect restaurant information.');
        }

        // create a owner profile
        let ownerProfile = new OwnerProfile(_.pick(req.body, ['companyName']));
        ownerProfile.user = user._id;
        ownerProfile.restaurants = restaurants;
        await ownerProfile.save();

        // reupdate user.profile
        user.profile = ownerProfile._id;
        await user.save();

        const token = user.generateAuthToken();
        res.header('x-auth-token', token).send(_.pick(user, ['_id', 'email', 'username', 'role']));
    }
});

function validate(req) {
  const schema = Joi.object({
    email: Joi.string().email(),
    username: Joi.string(),
    password: Joi.string().min(5).max(255).required()
  }).xor('email', 'username');
  return schema.validate(req);
}

module.exports = router; 
