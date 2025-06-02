const User = require('../models/user.model');
const OwnerProfile = require('../models/ownerProfile.model');
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

exports.updateMe = async (data, authUser) => {
    const session = isProdEnv ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
        // find user
        const user = await User.findById(authUser._id).session(session || null);
        if (!user) throw { status: 404, body: 'Owner not found.' };

        // check if email or username already taken
        const existingUser = await User.findOne({
            _id: { $ne: authUser._id },
            $or: [
                { email: data.email },
                { username: data.username }
            ]
        }).session(session).lean();
        if (existingUser) {
            if (existingUser.email === data.email) {
                throw { status: 400, body: 'Email is already taken.' };
            }
            if (existingUser.username === data.username) {
                throw { status: 400, body: 'Username is already taken.' };
            }
        }

        // update user
        Object.assign(user, _.pick(data, ['email', 'username']));
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(data.password, salt);
        await user.save({ session });

        // find and update profile
        const profile = await OwnerProfile.findByIdAndUpdate(
          user.profile, 
          { 
            companyName: data.companyName, username: data.username
          },
          { new: true, runValidators: true, session }
        ).lean();
        if (!profile) throw { status: 404, body: 'Profile not found.' };

        if (session) await session.commitTransaction();

        // send back user
        const token = generateAuthToken(user);
        const { password, ...safeUser } = user.toObject();
        safeUser.profile = profile;
        return { token, status: 200, body: safeUser };
    } catch (err) {
        if (session) await session.abortTransaction();
        throw err;
    } finally {
        if (session) session.endSession();
    }
};