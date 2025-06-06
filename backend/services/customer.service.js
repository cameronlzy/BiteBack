const User = require('../models/user.model');
const CustomerProfile = require('../models/customerProfile.model');
const Review = require('../models/review.model');
const Reservation = require('../models/reservation.model');
const ReviewBadgeVote = require('../models/reviewBadgeVote.model');
const { generateAuthToken } = require('./user.service');
const mongoose = require('mongoose');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const isProdEnv = process.env.NODE_ENV === 'production';

exports.getMe = async (userId) => {
    const user = await User.findById(userId)
        .populate('profile')
        .select('-password')
        .lean();
    if (!user) return { status: 400, body: 'User not found.' };
    return { status: 200, body: user };
};

exports.publicProfile = async (customerId) => {
    // get customer
    const customer = await CustomerProfile.findById(customerId)
        .select('+totalBadges +dateJoined +username')
        .lean();
    if (!customer) return { status: 404, body: 'Customer not found.' };

    return { status: 200, body: customer };
};

exports.updateMe = async (update, authUser) => {
    const session = isProdEnv ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
        // find user
        const user = await User.findById(authUser._id).populate('profile').session(session || null);
        if (!user) throw { status: 404, body: 'Customer not found' };
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
        await user.save(session ? { session } : undefined);

        // selectively update profile fields
        if (update.name !== undefined) user.profile.name = update.name;
        if (update.contactNumber !== undefined) user.profile.contactNumber = update.contactNumber;
        if (update.favCuisines !== undefined) user.profile.favCuisines = update.favCuisines;

        await user.profile.save(session ? { session } : undefined);

        // update reviews
        if (update.username !== undefined) {
            await Review.updateMany(
                { customer: user.profile._id },
                { $set: { username: update.username }},
                { session }
            );
        }

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

exports.deleteMe = async (user) => {
    const session = isProdEnv ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
        // delete reservations, reviews and profile
        await Promise.all([
            Reservation.deleteMany({ customer: user._id }).session(session || null),
            Review.deleteMany({ customer: user.profile._id }).session(session || null),
            ReviewBadgeVote.deleteMany({ customer: user.profile._id }).session(session || null),
            CustomerProfile.findByIdAndDelete(user.profile._id).session(session || null)
        ]);

        // delete user
        await user.deleteOne({ session });
        
        if (session) await session.commitTransaction();
        return { status: 200, body: user.toObject() };
    } catch (err) {
        if (session) await session.abortTransaction();
        throw err;
    } finally {
        if (session) session.endSession();
    }
};