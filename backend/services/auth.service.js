const User = require('../models/user.model');
const CustomerProfile = require('../models/customerProfile.model');
const OwnerProfile = require('../models/ownerProfile.model');
const { generateAuthToken } = require('../services/user.service');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const crypto = require('crypto');
const config = require('config');
const sendEmail = require('../helpers/sendEmail');

const isProdEnv = process.env.NODE_ENV === 'production';

exports.forgotPassword = async (credentials) => {
    // find user
    const user = await User.findOne(credentials.email 
        ? { email: credentials.email }
        : { username: credentials.username }
    );

    if (!user) return { status: 400, body: 'User with this email/username does not exist' };
    
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    user.resetPasswordToken = hash;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;
    await user.save();

    const resetLink = `${config.get('frontendLink')}/reset-password/${token}`;
    await sendEmail(user.email, 'Password Reset', `Click to reset your password: ${resetLink}`);

    return { status: 200, body: 'Password reset link sent to your email' };
};

exports.resetPassword = async (data, token) => {
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hash,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return { status: 400, body: 'Token is invalid or expired' };

    const { password } = data;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { status: 200, body: 'Password has been reset' };
};

exports.login = async (credentials) => {
    // find user and verify credentials
    const { status, body } = await this.verifyUserCredentials(credentials);
    if (status !== 200) return { status, body };
    const token = generateAuthToken(body);
    return { token, status: 200, body: _.pick(body, ['_id', 'email', 'username', 'role']) };
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
        }).session(session || null).lean();
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
        let customerProfile = new CustomerProfile(_.pick(data, ['name', 'contactNumber', 'favCuisines', 'username']));

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
        }).session(session || null).lean();
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

        // create a owner profile
        let ownerProfile = new OwnerProfile(_.pick(data, ['companyName', 'username']));
        ownerProfile.user = user._id;
        await ownerProfile.save({ session });

        // reupdate user.profile
        user.profile = ownerProfile._id;
        await user.save({ session });

        // commit transaction
        if (session) await session.commitTransaction();

        const token = generateAuthToken(user);
        const safeUser = _.pick(user, ['_id', 'email', 'username', 'role']);
        return { token, status: 200, body: safeUser };
    } catch (err) {
        if (session) await session.abortTransaction();
        throw err;
    } finally {
        if (session) session.endSession();
    }
};

// utility services
exports.verifyUserCredentials = async (credentials, session = null) => {
    const user = await User.findOne(credentials.email
        ? { email: credentials.email }
        : { username: credentials.username }
    ).session(session);

    if (!user) return { status: 400, body: 'Invalid email, username or password' };

    const isValid = await bcrypt.compare(credentials.password, user.password);
    if (!isValid) return { status: 400, body: 'Invalid email, username or password' };

    return { status: 200, body: user };
};