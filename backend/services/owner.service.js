const User = require('../models/user.model');
const OwnerProfile = require('../models/ownerProfile.model');
const Review = require('../models/review.model');
const { generateAuthToken } = require('./user.service');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const isProdEnv = process.env.NODE_ENV === 'production';

exports.getMe = async (userId) => {
    const user = await User.findById(userId)
        .populate({
            path: 'profile', 
            populate: {
                path: 'restaurants',
                model: 'Restaurant'
            }
        })
        .select('-password').lean();
    if (!user) return { status: 400, body: 'Owner not found.' };
    return { status: 200, body: user };
};

exports.updateMe = async (update, authUser) => {
    const session = isProdEnv ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
        // find user
        const user = await User.findById(authUser._id).populate('profile').session(session || null);
        if (!user) throw { status: 404, body: 'Owner not found' };
        if (!user.profile) throw { status: 404, body: 'Profile not found' };

        // check if email or username being updated and is already taken
        const uniqueCheck = [];
        if (update.email !== undefined) uniqueCheck.push({ email: update.email });
        if (update.username !== undefined) uniqueCheck.push({ username: update.username });

        if (uniqueCheck.length) {
            const existingUser = await User.findOne({
                _id: { $ne: authUser._id },
                $or: uniqueCheck,
            }).session(session || null).lean();

            if (existingUser) {
                if (existingUser.email === update.email) {
                    throw { status: 400, body: 'Email is already taken.' };
                }
                if (existingUser.username === update.username) {
                    throw { status: 400, body: 'Username is already taken.' };
                }
            }
        }

        // update user fields selectively
        if (update.email !== undefined) user.email = update.email;
        if (update.username !== undefined) user.username = update.username;
        if (update.password !== undefined) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(update.password, salt);
        }
        await user.save({ session });

        // selectively update profile fields
        if (update.companyName !== undefined) user.profile.companyName = update.companyName;

        await user.profile.save({ session });

        if (session) await session.commitTransaction();

        // send back user
        const token = generateAuthToken(user);
        const { password, ...safeUser } = user.toObject();
        safeUser.profile = user.profile.toObject();
        return { token, status: 200, body: safeUser };
    } catch (err) {
        if (session) await session.abortTransaction();
        throw err;
    } finally {
        if (session) session.endSession();
    }
};