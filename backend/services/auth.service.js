const User = require('../models/user.model');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const { generateAuthToken } = require('../services/user.service');
const { createRestaurantArray } = require('../services/restaurant.service');
const CustomerProfile = require('../models/customerProfile.model');
const OwnerProfile = require('../models/ownerProfile.model');

const isProdEnv = process.env.NODE_ENV === 'production';

exports.login = async (credentials) => {
    // find user
    const user = await User.findOne(credentials.email
        ? { email: credentials.email }
        : { username: credentials.username }
    );

    if (!user) return { status: 400, body: 'Invalid email or password.' };

    // check password
    const validPassword = await bcrypt.compare(credentials.password, user.password);
    if (!validPassword) return { status: 400, body: 'Invalid email or password.' };

    const token = generateAuthToken(user);
    return { token, status: 200, body: _.pick(user, ['_id', 'email', 'username', 'role']) };
};

exports.registerCustomer = async (data) => {
    const session = isProdEnv ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
        // if user exists
        let existingUser = await User.findOne({
          $or: [
            { email: data.email },
            { username: data.username }
          ]
        }).session(session || null);
        if (existingUser) {
            if (existingUser.email === data.email && existingUser.role === 'owner') {
                throw { status: 400, body: 'Email already registered to a restaurant owner.' };
            }
            if (existingUser.email === data.email && existingUser.role === 'customer') {
                throw { status: 400, body: 'Email already registered to a customer.' };
            }
            if (existingUser.username === data.username) {
                throw { status: 400, body: 'Username already taken.' };
            }
        }

        // create a customer profile
        let customerProfile = new CustomerProfile(_.pick(data, ['name', 'contactNumber', 'favCuisines']));

        // create new user
        let user = new User(_.pick(data, ['email', 'username', 'password', 'role']));
        customerProfile.user = user._id;
        await customerProfile.save({ session });

        // hash password and add references
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.roleProfile = 'CustomerProfile';
        user.profile = customerProfile._id;
        await user.save({ session });

        // commit transaction
        if (session) await session.commitTransaction();

        const token = generateAuthToken(user);
        return { token, status: 200, body: _.pick(user, ['_id', 'email', 'username', 'role']) };
    } catch (err) {
        if (session) await session.abortTransaction();
        throw err;
    } finally {
        if (session) session.endSession();
    }
};

exports.registerOwner = async (data) => {
    const session = isProdEnv ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
        // if user exists
        let existingUser = await User.findOne({
            $or: [
            { email: data.email },
            { username: data.username }
            ]
        }).session(session || null);
        if (existingUser) {
            if (existingUser.email === data.email && existingUser.role === 'owner') {
                throw { status: 400, body: 'Email already registered to a restaurant owner.' };
            }
            if (existingUser.email === data.email && existingUser.role === 'customer') {
                throw { status: 400, body: 'Email already registered to a customer.' };
            }
            if (existingUser.username === data.username) {
                throw { status: 400, body: 'Username already taken.' };
            }
        }


        // create new user
        let user = new User(_.pick(data, ['email', 'username', 'password', 'role']));

        // hash password and add references
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.roleProfile = 'OwnerProfile';
        user.profile = new mongoose.Types.ObjectId();

        // create restaurant array
        let restaurants;
        try {
            restaurants = await createRestaurantArray(data.restaurants, user._id, session);
        } catch (err) {
            throw { status: 400, body: 'Incorrect restaurant information.' };
        }

        // create a owner profile
        let ownerProfile = new OwnerProfile(_.pick(data, ['companyName']));
        ownerProfile.user = user._id;
        ownerProfile.restaurants = restaurants;
        await ownerProfile.save({ session });

        // reupdate user.profile
        user.profile = ownerProfile._id;
        await user.save({ session });

        // commit transaction
        if (session) await session.commitTransaction();

        const token = generateAuthToken(user);
        return { token, status: 200, body: _.pick(user, ['_id', 'email', 'username', 'role']) };
    } catch (err) {
        if (session) await session.abortTransaction();
        throw err;
    } finally {
        if (session) session.endSession();
    }
};